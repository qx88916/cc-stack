/**
 * Driver matching service - finds nearest available driver for ride requests
 * Uses geospatial queries to find drivers within radius, sorted by distance
 */

import mongoose from 'mongoose';
import { DriverModel } from '../models/Driver';
import { RideModel } from '../models/Ride';
import { emitToUser } from '../realtime';
import { sendPushNotification } from './push';

interface Location {
  latitude: number;
  longitude: number;
}

const SEARCH_RADIUS_KM = 10; // Search within 10km radius
const MAX_SEARCH_ATTEMPTS = 3; // Try 3 times with increasing radius

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
      Math.cos(toRad(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Find nearest available driver for a ride
 * Returns driver ID if found, null otherwise
 */
export async function findNearestDriver(
  pickupLocation: Location,
  rideId: string
): Promise<string | null> {
  try {
    let radiusKm = SEARCH_RADIUS_KM;

    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
      const onlineDrivers = await DriverModel.find({
        isOnline: true,
        lastLocation: { $exists: true },
      }).lean();

      if (onlineDrivers.length === 0) {
        return null;
      }

      // Calculate distance to each driver and filter by radius
      const driversWithDistance = onlineDrivers
        .map((driver) => {
          if (!driver.lastLocation?.latitude || !driver.lastLocation?.longitude) return null;
          
          const distance = calculateDistance(pickupLocation, {
            latitude: driver.lastLocation.latitude,
            longitude: driver.lastLocation.longitude,
          });

          return {
            driverId: String(driver._id),
            userId: String(driver.userId),
            distance,
            location: driver.lastLocation,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null && d.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance); // Sort by nearest first

      if (driversWithDistance.length === 0) {
        radiusKm += 5;
        continue;
      }

      // Try to assign the nearest driver
      for (const driver of driversWithDistance) {
        // Check if driver is already assigned to another active ride
        const existingRide = await RideModel.findOne({
          driverId: driver.driverId,
          status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] },
        });

        if (existingRide) {
          continue;
        }

        const rideDoc = await RideModel.findById(rideId).lean();
        const requestPayload = {
          rideId,
          distance: driver.distance,
          pickup: pickupLocation,
          fare: rideDoc?.fare,
          pickupAddress: rideDoc?.pickup?.description,
          dropoffAddress: rideDoc?.dropoff?.description,
        };
        emitToUser(driver.userId, 'ride:request', requestPayload);

        // Also send push notification
        const driverDoc = await DriverModel.findById(driver.driverId).lean();
        if (driverDoc?.pushToken) {
          const fareStr = rideDoc?.fare ? ` · FJD $${rideDoc.fare.toFixed(2)}` : '';
          sendPushNotification(
            driverDoc.pushToken as string,
            'New Ride Request',
            `${rideDoc?.pickup?.description || 'Nearby pickup'}${fareStr}`,
            { rideId, screen: 'home' }
          );
        }

        return driver.driverId;
      }

      radiusKm += 5;
    }

    return null;
  } catch (error) {
    console.error('[Matching] Error finding driver:', error);
    return null;
  }
}

/**
 * Find nearest driver excluding a list of rejected driver IDs.
 * Used after a driver rejects a ride to re-match with the next nearest.
 */
export async function findNearestDriverExcluding(
  pickupLocation: Location,
  rideId: string,
  passengerId: string,
  excludeDriverIds: string[]
): Promise<void> {
  try {
    let radiusKm = SEARCH_RADIUS_KM;

    for (let attempt = 1; attempt <= MAX_SEARCH_ATTEMPTS; attempt++) {
      const onlineDrivers = await DriverModel.find({
        isOnline: true,
        lastLocation: { $exists: true },
        _id: { $nin: excludeDriverIds },
      }).lean();

      if (onlineDrivers.length === 0) {
        emitToUser(passengerId, 'ride:no_drivers', { rideId });
        return;
      }

      const driversWithDistance = onlineDrivers
        .map((driver) => {
          if (!driver.lastLocation?.latitude || !driver.lastLocation?.longitude) return null;
          const distance = calculateDistance(pickupLocation, {
            latitude: driver.lastLocation.latitude,
            longitude: driver.lastLocation.longitude,
          });
          return {
            driverId: String(driver._id),
            userId: String(driver.userId),
            distance,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null && d.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      if (driversWithDistance.length === 0) {
        radiusKm += 5;
        continue;
      }

      for (const driver of driversWithDistance) {
        const existingRide = await RideModel.findOne({
          driverId: driver.driverId,
          status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] },
        });
        if (existingRide) continue;

        const rideDoc = await RideModel.findById(rideId).lean();
        emitToUser(driver.userId, 'ride:request', {
          rideId,
          distance: driver.distance,
          pickup: pickupLocation,
          fare: rideDoc?.fare,
          pickupAddress: rideDoc?.pickup?.description,
          dropoffAddress: rideDoc?.dropoff?.description,
        });
        return;
      }

      radiusKm += 5;
    }

    emitToUser(passengerId, 'ride:no_drivers', { rideId });
  } catch (error) {
    console.error('[Matching] Error re-matching driver:', error);
  }
}

/**
 * Auto-assign driver to ride after creation
 * Updates ride status and notifies both passenger and driver
 */
export async function autoAssignDriver(rideId: string, passengerId: string): Promise<void> {
  try {
    const ride = await RideModel.findById(rideId);
    if (!ride) {
      console.error('[Matching] Ride not found:', rideId);
      return;
    }

    if (!ride.pickup?.coords?.latitude || !ride.pickup?.coords?.longitude) {
      console.error('[Matching] Ride missing pickup coordinates');
      return;
    }

    const pickupLocation = {
      latitude: ride.pickup.coords.latitude,
      longitude: ride.pickup.coords.longitude,
    };

    const driverId = await findNearestDriver(pickupLocation, rideId);

    if (!driverId) {
      emitToUser(passengerId, 'ride:no_drivers', { rideId });
      return;
    }

    ride.driverId = new mongoose.Types.ObjectId(driverId);
    ride.status = 'accepted';
    ride.updatedAt = new Date();
    await ride.save();

    const populatedRide = await RideModel.findById(rideId).populate('driverId');

    emitToUser(passengerId, 'ride:driver_assigned', {
      rideId,
      driver: populatedRide?.driverId,
      status: 'accepted',
    });
  } catch (error) {
    console.error('[Matching] Error auto-assigning driver:', error);
  }
}
