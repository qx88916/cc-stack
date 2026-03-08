/**
 * Seed script to create initial admin user and default settings
 * Run with: node setup-admin.js or ts-node scripts/seed-admin.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserModel, hashPassword } from '../src/models/User';
import { SettingsModel } from '../src/models/Settings';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ridehailing';

async function seedAdminData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user
    const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@cabconnect.com';
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';

    const existingAdmin = await UserModel.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', adminEmail);
    } else {
      const passwordHash = await hashPassword(adminPassword);
      
      const admin = await UserModel.create({
        email: adminEmail,
        name: 'Admin',
        passwordHash,
        role: 'admin',
        emailVerified: true,
      });

      console.log('✅ Admin user created successfully');
      console.log('   Email:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   User ID:', admin._id);
    }

    // Create or update default settings
    let settings = await SettingsModel.findOne();
    
    if (settings) {
      console.log('ℹ️  Settings already exist, updating defaults...');
      
      // Update with defaults if any field is missing
      settings.fare = settings.fare || {
        baseFare: 5.0,
        perKmRate: 1.5,
        perMinuteRate: 0.5,
        minimumFare: 5.0,
        surgeMultiplier: 1.0,
        taxRate: 0.1,
      };
      
      settings.geofence = settings.geofence || {
        enabled: true,
        maxDistanceKm: 50,
        centerCoordinates: { latitude: 0, longitude: 0 },
        radiusKm: 30,
      };
      
      settings.general = settings.general || {
        appName: 'CabConnect',
        supportEmail: 'support@cabconnect.com',
        supportPhone: '+1-000-000-0000',
        maintenanceMode: false,
      };
      
      await settings.save();
      console.log('✅ Settings updated successfully');
    } else {
      settings = await SettingsModel.create({
        fare: {
          baseFare: 5.0,
          perKmRate: 1.5,
          perMinuteRate: 0.5,
          minimumFare: 5.0,
          surgeMultiplier: 1.0,
          taxRate: 0.1,
        },
        geofence: {
          enabled: true,
          maxDistanceKm: 50,
          centerCoordinates: { latitude: 0, longitude: 0 },
          radiusKm: 30,
        },
        general: {
          appName: 'CabConnect',
          supportEmail: 'support@cabconnect.com',
          supportPhone: '+1-000-000-0000',
          maintenanceMode: false,
        },
      });
      
      console.log('✅ Default settings created successfully');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Admin setup completed successfully!');
    console.log('='.repeat(60));
    console.log('\nYou can now login with:');
    console.log('  Email:', adminEmail);
    console.log('  Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error seeding admin data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedAdminData();
