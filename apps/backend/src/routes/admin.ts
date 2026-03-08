import { Router } from 'express';
import { authMiddleware, requireAdmin, type AuthReq } from '../middleware/auth';
import { UserModel } from '../models/User';
import { DriverModel } from '../models/Driver';
import { RideModel } from '../models/Ride';
import { getSettings, updateSettings, SettingsModel } from '../models/Settings';
import mongoose from 'mongoose';

export const adminRouter = Router();

// All admin routes require authentication and admin role
adminRouter.use(authMiddleware);
adminRouter.use(requireAdmin);

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * GET /admin/users
 * List all users with pagination and filters
 */
adminRouter.get('/users', async (req: AuthReq, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    // Filter by role
    if (req.query.role && ['passenger', 'driver', 'admin'].includes(req.query.role as string)) {
      filter.role = req.query.role;
    }

    // Filter by email verified status
    if (req.query.emailVerified !== undefined) {
      filter.emailVerified = req.query.emailVerified === 'true';
    }

    // Filter by deleted status
    if (req.query.includeDeleted === 'true') {
      // Include deleted users
    } else {
      filter.isDeleted = false;
    }

    // Search by email, phone, or name
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { email: searchRegex },
        { phone: searchRegex },
        { name: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

/**
 * GET /admin/users/:id
 * Get user details including ride history
 */
adminRouter.get('/users/:id', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await UserModel.findById(id).select('-passwordHash').lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get ride count and stats
    let rideStats = null;
    if (user.role === 'passenger') {
      const rides = await RideModel.find({ passengerId: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const totalRides = await RideModel.countDocuments({ passengerId: id });
      const completedRides = await RideModel.countDocuments({ 
        passengerId: id, 
        status: 'completed' 
      });
      const cancelledRides = await RideModel.countDocuments({ 
        passengerId: id, 
        status: 'cancelled' 
      });

      const totalSpent = await RideModel.aggregate([
        { $match: { passengerId: new mongoose.Types.ObjectId(id), status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]);

      rideStats = {
        totalRides,
        completedRides,
        cancelledRides,
        totalSpent: totalSpent[0]?.total || 0,
        recentRides: rides,
      };
    } else if (user.role === 'driver') {
      const driver = await DriverModel.findOne({ userId: id }).lean();
      const rides = await RideModel.find({ driverId: driver?._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const totalRides = await RideModel.countDocuments({ driverId: driver?._id });
      const completedRides = await RideModel.countDocuments({ 
        driverId: driver?._id, 
        status: 'completed' 
      });

      const totalEarnings = await RideModel.aggregate([
        { $match: { driverId: driver?._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]);

      rideStats = {
        driver,
        totalRides,
        completedRides,
        totalEarnings: totalEarnings[0]?.total || 0,
        recentRides: rides,
      };
    }

    res.json({
      user,
      rideStats,
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Failed to fetch user details', error: error.message });
  }
});

/**
 * PATCH /admin/users/:id
 * Update user details
 */
adminRouter.patch('/users/:id', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone.trim();

    const user = await UserModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

/**
 * PATCH /admin/users/:id/role
 * Change user role
 */
adminRouter.patch('/users/:id/role', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!['passenger', 'driver', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be passenger, driver, or admin' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If changing to driver, create Driver document if it doesn't exist
    if (role === 'driver') {
      const existingDriver = await DriverModel.findOne({ userId: id });
      if (!existingDriver) {
        await DriverModel.create({
          userId: id,
          name: user.name || 'Driver',
          phone: user.phone || '',
        });
      }
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
});

/**
 * DELETE /admin/users/:id
 * Soft delete user account
 */
adminRouter.delete('/users/:id', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves
    if (id === req.userId) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully', user });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
});

/**
 * POST /admin/users/:id/restore
 * Restore soft-deleted user
 */
adminRouter.post('/users/:id/restore', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isDeleted: false, deletedAt: null },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User restored successfully', user });
  } catch (error: any) {
    console.error('Error restoring user:', error);
    res.status(500).json({ message: 'Failed to restore user', error: error.message });
  }
});

/**
 * PATCH /admin/users/:id/verify-email
 * Manually verify user email
 */
adminRouter.patch('/users/:id/verify-email', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { emailVerified: true },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Email verified successfully', user });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Failed to verify email', error: error.message });
  }
});

/**
 * GET /admin/users/:id/rides
 * Get user's ride history
 */
adminRouter.get('/users/:id/rides', async (req: AuthReq, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {};
    if (user.role === 'passenger') {
      query.passengerId = id;
    } else if (user.role === 'driver') {
      const driver = await DriverModel.findOne({ userId: id });
      if (!driver) {
        return res.json({ rides: [], pagination: { page, limit, total: 0, pages: 0 } });
      }
      query.driverId = driver._id;
    } else {
      return res.status(400).json({ message: 'User is not a passenger or driver' });
    }

    const [rides, total] = await Promise.all([
      RideModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      RideModel.countDocuments(query),
    ]);

    res.json({
      rides,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({ message: 'Failed to fetch user rides', error: error.message });
  }
});

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * GET /admin/settings
 * Get all system settings
 */
adminRouter.get('/settings', async (req: AuthReq, res) => {
  try {
    const settings = await getSettings();
    res.json({ settings });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

/**
 * PATCH /admin/settings/fare
 * Update fare configuration
 */
adminRouter.patch('/settings/fare', async (req: AuthReq, res) => {
  try {
    const { baseFare, perKmRate, perMinuteRate, minimumFare, surgeMultiplier, taxRate } = req.body;

    const updates: any = { fare: {} };
    if (baseFare !== undefined) updates.fare.baseFare = baseFare;
    if (perKmRate !== undefined) updates.fare.perKmRate = perKmRate;
    if (perMinuteRate !== undefined) updates.fare.perMinuteRate = perMinuteRate;
    if (minimumFare !== undefined) updates.fare.minimumFare = minimumFare;
    if (surgeMultiplier !== undefined) updates.fare.surgeMultiplier = surgeMultiplier;
    if (taxRate !== undefined) updates.fare.taxRate = taxRate;

    const settings = await updateSettings(updates, req.userId!);

    res.json({ message: 'Fare settings updated successfully', settings });
  } catch (error: any) {
    console.error('Error updating fare settings:', error);
    res.status(500).json({ message: 'Failed to update fare settings', error: error.message });
  }
});

/**
 * PATCH /admin/settings/geofence
 * Update geofence configuration
 */
adminRouter.patch('/settings/geofence', async (req: AuthReq, res) => {
  try {
    const { enabled, maxDistanceKm, centerCoordinates, radiusKm } = req.body;

    const updates: any = { geofence: {} };
    if (enabled !== undefined) updates.geofence.enabled = enabled;
    if (maxDistanceKm !== undefined) updates.geofence.maxDistanceKm = maxDistanceKm;
    if (centerCoordinates !== undefined) {
      updates.geofence.centerCoordinates = centerCoordinates;
    }
    if (radiusKm !== undefined) updates.geofence.radiusKm = radiusKm;

    const settings = await updateSettings(updates, req.userId!);

    res.json({ message: 'Geofence settings updated successfully', settings });
  } catch (error: any) {
    console.error('Error updating geofence settings:', error);
    res.status(500).json({ message: 'Failed to update geofence settings', error: error.message });
  }
});

/**
 * PATCH /admin/settings/general
 * Update general settings
 */
adminRouter.patch('/settings/general', async (req: AuthReq, res) => {
  try {
    const { appName, supportEmail, supportPhone, maintenanceMode } = req.body;

    const updates: any = { general: {} };
    if (appName !== undefined) updates.general.appName = appName;
    if (supportEmail !== undefined) updates.general.supportEmail = supportEmail;
    if (supportPhone !== undefined) updates.general.supportPhone = supportPhone;
    if (maintenanceMode !== undefined) updates.general.maintenanceMode = maintenanceMode;

    const settings = await updateSettings(updates, req.userId!);

    res.json({ message: 'General settings updated successfully', settings });
  } catch (error: any) {
    console.error('Error updating general settings:', error);
    res.status(500).json({ message: 'Failed to update general settings', error: error.message });
  }
});

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

/**
 * GET /admin/stats/overview
 * Get dashboard overview statistics
 */
adminRouter.get('/stats/overview', async (req: AuthReq, res) => {
  try {
    const [
      totalUsers,
      totalPassengers,
      totalDrivers,
      totalAdmins,
      onlineDrivers,
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      revenueData,
    ] = await Promise.all([
      UserModel.countDocuments({ isDeleted: false }),
      UserModel.countDocuments({ role: 'passenger', isDeleted: false }),
      UserModel.countDocuments({ role: 'driver', isDeleted: false }),
      UserModel.countDocuments({ role: 'admin', isDeleted: false }),
      DriverModel.countDocuments({ isOnline: true }),
      RideModel.countDocuments(),
      RideModel.countDocuments({ status: 'completed' }),
      RideModel.countDocuments({ status: 'cancelled' }),
      RideModel.countDocuments({ 
        status: { $in: ['searching', 'accepted', 'arriving', 'ongoing'] } 
      }),
      RideModel.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$fare' } } },
      ]),
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    res.json({
      stats: {
        users: {
          total: totalUsers,
          passengers: totalPassengers,
          drivers: totalDrivers,
          admins: totalAdmins,
        },
        drivers: {
          total: totalDrivers,
          online: onlineDrivers,
          offline: totalDrivers - onlineDrivers,
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          cancelled: cancelledRides,
          active: activeRides,
        },
        revenue: {
          total: totalRevenue,
          currency: 'USD',
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Failed to fetch overview stats', error: error.message });
  }
});
