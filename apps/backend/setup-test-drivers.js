/**
 * Setup Test Drivers for E2E Testing
 * 
 * This script creates test driver accounts with online status in Suva, Nadi, and Lautoka
 * Run with: node setup-test-drivers.js
 */

const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/ridehailing', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schemas (minimal version for testing)
const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  passwordHash: String,
  phone: String,
  emailVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const driverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isOnline: { type: Boolean, default: false },
  lastLocation: {
    latitude: Number,
    longitude: Number,
  },
  name: String,
  vehicle: String,
  plateNumber: String,
  phone: String,
  rating: { type: Number, default: 5.0 },
});

const User = mongoose.model('User', userSchema);
const Driver = mongoose.model('Driver', driverSchema);

// Test driver data for Fiji locations
const testDrivers = [
  {
    // Driver 1: Suva area
    user: {
      email: 'driver1@cabconnect.test',
      name: 'John Tuivaga',
      role: 'driver',
      phone: '+6799123001',
      passwordHash: '$2a$10$dummyHashForTestingOnly12345678901234567890123456789',
      emailVerified: true,
    },
    driver: {
      isOnline: true,
      lastLocation: {
        latitude: -18.1416,  // Suva city center
        longitude: 178.4419,
      },
      name: 'John Tuivaga',
      vehicle: 'Toyota Corolla',
      plateNumber: 'FJ-1234',
      phone: '+6799123001',
      rating: 4.8,
    },
  },
  {
    // Driver 2: Nadi area
    user: {
      email: 'driver2@cabconnect.test',
      name: 'Maria Singh',
      role: 'driver',
      phone: '+6799123002',
      passwordHash: '$2a$10$dummyHashForTestingOnly12345678901234567890123456789',
      emailVerified: true,
    },
    driver: {
      isOnline: true,
      lastLocation: {
        latitude: -17.7765,  // Nadi town
        longitude: 177.4370,
      },
      name: 'Maria Singh',
      vehicle: 'Honda Civic',
      plateNumber: 'FJ-5678',
      phone: '+6799123002',
      rating: 4.9,
    },
  },
  {
    // Driver 3: Lautoka area
    user: {
      email: 'driver3@cabconnect.test',
      name: 'Seru Bale',
      role: 'driver',
      phone: '+6799123003',
      passwordHash: '$2a$10$dummyHashForTestingOnly12345678901234567890123456789',
      emailVerified: true,
    },
    driver: {
      isOnline: true,
      lastLocation: {
        latitude: -17.6161,  // Lautoka city
        longitude: 177.4460,
      },
      name: 'Seru Bale',
      vehicle: 'Nissan Tiida',
      plateNumber: 'FJ-9012',
      phone: '+6799123003',
      rating: 5.0,
    },
  },
  {
    // Driver 4: Suva area (offline for testing)
    user: {
      email: 'driver4@cabconnect.test',
      name: 'Ana Kolinisau',
      role: 'driver',
      phone: '+6799123004',
      passwordHash: '$2a$10$dummyHashForTestingOnly12345678901234567890123456789',
      emailVerified: true,
    },
    driver: {
      isOnline: false,  // Offline for "no drivers" testing
      lastLocation: {
        latitude: -18.1500,
        longitude: 178.4500,
      },
      name: 'Ana Kolinisau',
      vehicle: 'Mazda Demio',
      plateNumber: 'FJ-3456',
      phone: '+6799123004',
      rating: 4.7,
    },
  },
];

async function setupDrivers() {
  try {
    console.log('🚀 Setting up test drivers...\n');

    // Clear existing test drivers
    await User.deleteMany({ email: { $regex: '@cabconnect.test$' } });
    await Driver.deleteMany({});
    console.log('✅ Cleared existing test data\n');

    // Create drivers
    for (const testData of testDrivers) {
      // Create user
      const user = await User.create(testData.user);
      console.log(`✓ Created user: ${user.name} (${user.email})`);

      // Create driver profile
      const driver = await Driver.create({
        ...testData.driver,
        userId: user._id,
      });
      console.log(`  ✓ Driver profile created`);
      console.log(`  📍 Location: ${testData.driver.lastLocation.latitude}, ${testData.driver.lastLocation.longitude}`);
      console.log(`  🚗 Vehicle: ${testData.driver.vehicle} (${testData.driver.plateNumber})`);
      console.log(`  📊 Status: ${testData.driver.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
      console.log(`  ⭐ Rating: ${testData.driver.rating}\n`);
    }

    console.log('\n✅ Test drivers setup complete!\n');
    console.log('📋 Summary:');
    console.log(`   - Total drivers: ${testDrivers.length}`);
    console.log(`   - Online: ${testDrivers.filter(d => d.driver.isOnline).length}`);
    console.log(`   - Offline: ${testDrivers.filter(d => !d.driver.isOnline).length}\n`);
    
    console.log('📍 Coverage Areas:');
    console.log('   - Suva: 2 drivers (1 online, 1 offline)');
    console.log('   - Nadi: 1 driver (online)');
    console.log('   - Lautoka: 1 driver (online)\n');

    console.log('🧪 Ready for E2E testing!');
    console.log('   You can now book rides in Suva, Nadi, or Lautoka\n');

  } catch (error) {
    console.error('❌ Error setting up drivers:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run the setup
setupDrivers();
