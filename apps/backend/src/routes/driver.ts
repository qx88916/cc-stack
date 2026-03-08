import { Router } from 'express';
import { RideModel } from '../models/Ride';
import { DriverModel } from '../models/Driver';
import { UserModel } from '../models/User';
import { authMiddleware, requireDriver, type AuthReq } from '../middleware/auth';
import { emitToPassenger } from '../realtime';
import { sendPushNotification } from '../services/push';

async function getPassengerPushToken(passengerId: string): Promise<string | null> {
  const user = await UserModel.findById(passengerId).select('pushToken').lean();
  return (user as { pushToken?: string } | null)?.pushToken ?? null;
}

export const driverRouter = Router();

function toRideResponse(ride: any, driverDoc?: any, passengerDoc?: any) {
  const r = ride.toObject ? ride.toObject() : ride;
  const driver = driverDoc
    ? {
        id: String(driverDoc._id),
        name: driverDoc.name || 'Driver',
        rating: driverDoc.rating ?? 5,
        vehicle: driverDoc.vehicle || 'Car',
        plateNumber: driverDoc.plateNumber || '',
        phone: driverDoc.phone || '',
        location: driverDoc.lastLocation || r.pickup?.coords,
      }
    : undefined;
  const passenger = passengerDoc
    ? {
        id: String(passengerDoc._id),
        name: passengerDoc.name || 'Passenger',
        phone: passengerDoc.phone || '',
        email: passengerDoc.email || '',
      }
    : undefined;
  return {
    id: String(r._id),
    passengerId: String(r.passengerId),
    passenger,
    pickup: r.pickup,
    dropoff: r.dropoff,
    status: r.status,
    fare: r.fare,
    currency: r.currency || 'USD',
    distanceKm: r.distanceKm,
    durationMinutes: r.durationMinutes,
    driver,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    completedAt: r.completedAt,
    cancelledAt: r.cancelledAt,
    cancellationReason: r.cancellationReason,
  };
}

driverRouter.patch('/availability', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const { isOnline } = req.body ?? {};
    const driver = await DriverModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: { isOnline: Boolean(isOnline), updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    res.json({ isOnline: driver.isOnline });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.get('/availability', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId }).lean();
    res.json({ isOnline: driver?.isOnline ?? false });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.post('/push-token', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const { pushToken } = req.body ?? {};
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ message: 'pushToken required' });
    }
    await DriverModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: { pushToken } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.patch('/location', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const { latitude, longitude } = req.body ?? {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ message: 'latitude and longitude required (numbers)' });
    }
    await DriverModel.findOneAndUpdate(
      { userId: req.userId },
      { $set: { lastLocation: { latitude, longitude }, updatedAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.get('/ride-requests', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver || !driver.isOnline) {
      return res.json([]);
    }
    const list = await RideModel.find({ status: 'searching' })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('passengerId')
      .lean();
    const out = (list as any[]).map((r) => toRideResponse(r, undefined, r.passengerId));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.post('/ride/:id/accept', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver || !driver.isOnline) {
      return res.status(400).json({ message: 'Driver must be online to accept' });
    }
    const ride = await RideModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          driverId: driver._id,
          status: 'accepted',
          updatedAt: new Date(),
        },
      },
      { new: true }
    )
      .populate('driverId')
      .populate('passengerId');
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'accepted') {
      return res.status(400).json({ message: 'Ride no longer available' });
    }
    const passengerId = String((ride as any).passengerId?._id ?? ride.passengerId);
    const out = toRideResponse(ride, (ride as any).driverId, (ride as any).passengerId);
    emitToPassenger(passengerId, 'ride:accepted', out);
    const driverName = (ride as any).driverId?.name || 'Your driver';
    getPassengerPushToken(passengerId).then((token) => {
      if (token) {
        sendPushNotification(token, 'Driver on the way!', `${driverName} has accepted your ride and is heading to you.`, { rideId: String(ride._id) });
      }
    }).catch(() => undefined);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.post('/ride/:id/reject', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.status(403).json({ message: 'Not a driver' });

    const ride = await RideModel.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    // Only the assigned driver can reject
    if (ride.driverId && String(ride.driverId) !== String(driver._id)) {
      return res.status(400).json({ message: 'Not assigned to this ride' });
    }

    // Add to rejected list, clear assignment, reset to searching
    const rejectedList = ride.rejectedDrivers || [];
    if (!rejectedList.some((id: any) => String(id) === String(driver._id))) {
      rejectedList.push(driver._id);
    }
    ride.rejectedDrivers = rejectedList;
    ride.driverId = undefined as any;
    ride.status = 'searching';
    ride.updatedAt = new Date();
    await ride.save();

    // Try to find another driver, excluding rejected ones
    const { findNearestDriverExcluding } = await import('../services/matching');
    const pickupCoords = ride.pickup?.coords;
    if (pickupCoords?.latitude && pickupCoords?.longitude) {
      await findNearestDriverExcluding(
        { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
        String(ride._id),
        String(ride.passengerId),
        rejectedList.map((id: any) => String(id))
      );
    }

    res.json({ ok: true, message: 'Ride rejected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.get('/ride/active', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.json({ ride: null });
    const ride = await RideModel.findOne({
      driverId: driver._id,
      status: { $in: ['accepted', 'arriving', 'ongoing'] },
    })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('driverId')
      .populate('passengerId');
    if (!ride) return res.json({ ride: null });
    res.json({
      ride: toRideResponse(ride, (ride as any).driverId, (ride as any).passengerId),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.patch('/ride/:id/status', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ message: 'Status required' });
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.status(403).json({ message: 'Not a driver' });
    const ride = await RideModel.findOne({
      _id: req.params.id,
      driverId: driver._id,
    });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = status;
    ride.updatedAt = new Date();
    if (status === 'completed') ride.completedAt = new Date();
    if (status === 'cancelled') {
      ride.cancelledAt = new Date();
      ride.cancellationReason = req.body.reason || 'Driver cancelled';
    }
    await ride.save();
    const populated = await RideModel.findById(ride._id)
      .populate('driverId')
      .populate('passengerId');
    const out = toRideResponse(populated, (populated as any)?.driverId, (populated as any)?.passengerId);
    const passengerIdStr = String((ride as any).passengerId?._id ?? ride.passengerId);
    emitToPassenger(passengerIdStr, 'ride:status', out);
    const pushMessages: Record<string, { title: string; body: string }> = {
      arriving: { title: 'Driver has arrived!', body: 'Your driver is at the pickup location.' },
      ongoing: { title: 'Trip started', body: 'Your ride is underway. Sit back and relax!' },
      completed: { title: 'Trip completed', body: 'You have reached your destination. Rate your driver!' },
    };
    const msg = pushMessages[status];
    if (msg) {
      getPassengerPushToken(passengerIdStr).then((token) => {
        if (token) sendPushNotification(token, msg.title, msg.body, { rideId: req.params.id });
      }).catch(() => undefined);
    }
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.post('/ride/:id/cancel', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const { reason } = req.body || {};
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.status(403).json({ message: 'Not a driver' });
    const ride = await RideModel.findOne({
      _id: req.params.id,
      driverId: driver._id,
    });
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    ride.updatedAt = new Date();
    ride.cancellationReason = reason || 'Driver cancelled';
    await ride.save();
    const populated = await RideModel.findById(ride._id)
      .populate('driverId')
      .populate('passengerId');
    const out = toRideResponse(populated, (populated as any)?.driverId, (populated as any)?.passengerId);
    const passengerIdForCancel = String((ride as any).passengerId?._id ?? ride.passengerId);
    emitToPassenger(passengerIdForCancel, 'ride:status', out);
    getPassengerPushToken(passengerIdForCancel).then((token) => {
      if (token) sendPushNotification(token, 'Ride cancelled', 'Your driver has cancelled the ride. We will find you a new driver.', { rideId: req.params.id });
    }).catch(() => undefined);
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.get('/history', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.json([]);
    const list = await RideModel.find({
      driverId: driver._id,
      status: { $in: ['completed', 'cancelled'] },
    })
      .sort({ updatedAt: -1 })
      .populate('driverId')
      .populate('passengerId')
      .lean();
    const out = (list as any[]).map((r) => toRideResponse(r, r.driverId, r.passengerId));
    res.json(out);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

driverRouter.get('/history/:id', authMiddleware, requireDriver, async (req: AuthReq, res) => {
  try {
    const driver = await DriverModel.findOne({ userId: req.userId });
    if (!driver) return res.status(403).json({ message: 'Not a driver' });
    const ride = await RideModel.findOne({
      _id: req.params.id,
      driverId: driver._id,
    })
      .populate('driverId')
      .populate('passengerId')
      .lean();
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.json(toRideResponse(ride, (ride as any).driverId, (ride as any).passengerId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});
