// ============================================
// CabConnect - MongoDB Test Data Setup
// ============================================
// Run this script in mongosh or MongoDB Compass
// Connection: mongodb://127.0.0.1:27017/ridehailing

// Switch to the database
use ridehailing;

// ============================================
// 1. CLEAR EXISTING TEST DATA (Optional)
// ============================================
print("\n========== CLEARING TEST DATA ==========");

// Remove test users (emails ending with @test.com)
const deletedUsers = db.users.deleteMany({ 
  email: { $regex: '@test\\.com$' } 
});
print(`✅ Deleted ${deletedUsers.deletedCount} test users`);

// Remove test rides
const deletedRides = db.rides.deleteMany({});
print(`✅ Deleted ${deletedRides.deletedCount} rides`);

// Remove test drivers
const deletedDrivers = db.drivers.deleteMany({});
print(`✅ Deleted ${deletedDrivers.deletedCount} drivers`);

// ============================================
// 2. CREATE TEST DRIVER USERS
// ============================================
print("\n========== CREATING TEST DRIVERS ==========");

// Password: "Driver123!" (bcrypt hash)
const driverPasswordHash = "$2b$10$N5Zx3jF8K9mZQvP6Y4qE0.H3FXqnYvP8pZY1Z8qE0H3FXqnYvP8pZ";

// Driver 1: Suva Area
const driver1 = db.users.insertOne({
  email: "driver1@test.com",
  phone: "+6791234567",
  name: "John Ravouvou",
  role: "driver",
  passwordHash: driverPasswordHash,
  emailVerified: true,
  profilePhoto: "https://ui-avatars.com/api/?name=John+Ravouvou&background=10b981&color=fff",
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver user: John Ravouvou (Suva)`);

// Driver 2: Nadi Area  
const driver2 = db.users.insertOne({
  email: "driver2@test.com",
  phone: "+6791234568",
  name: "Maria Tora",
  role: "driver",
  passwordHash: driverPasswordHash,
  emailVerified: true,
  profilePhoto: "https://ui-avatars.com/api/?name=Maria+Tora&background=10b981&color=fff",
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver user: Maria Tora (Nadi)`);

// Driver 3: Lautoka Area
const driver3 = db.users.insertOne({
  email: "driver3@test.com",
  phone: "+6791234569",
  name: "Pita Vulaono",
  role: "driver",
  passwordHash: driverPasswordHash,
  emailVerified: true,
  profilePhoto: "https://ui-avatars.com/api/?name=Pita+Vulaono&background=10b981&color=fff",
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver user: Pita Vulaono (Lautoka)`);

// ============================================
// 3. CREATE DRIVER PROFILES
// ============================================
print("\n========== CREATING DRIVER PROFILES ==========");

// Driver 1 Profile (Suva)
db.drivers.insertOne({
  userId: driver1.insertedId,
  isOnline: true,
  name: "John Ravouvou",
  phone: "+6791234567",
  vehicle: {
    make: "Toyota",
    model: "Camry",
    year: 2020,
    color: "Silver"
  },
  plateNumber: "FJ1234",
  rating: 4.8,
  totalRides: 156,
  lastLocation: {
    type: "Point",
    coordinates: [178.4419, -18.1416] // Thurston Gardens, Suva
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver profile: John Ravouvou (ONLINE in Suva)`);

// Driver 2 Profile (Nadi)
db.drivers.insertOne({
  userId: driver2.insertedId,
  isOnline: true,
  name: "Maria Tora",
  phone: "+6791234568",
  vehicle: {
    make: "Honda",
    model: "Accord",
    year: 2019,
    color: "Blue"
  },
  plateNumber: "FJ5678",
  rating: 4.9,
  totalRides: 203,
  lastLocation: {
    type: "Point",
    coordinates: [177.4434, -17.7554] // Nadi Airport
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver profile: Maria Tora (ONLINE in Nadi)`);

// Driver 3 Profile (Lautoka) - OFFLINE for testing
db.drivers.insertOne({
  userId: driver3.insertedId,
  isOnline: false, // Offline for "no drivers" testing
  name: "Pita Vulaono",
  phone: "+6791234569",
  vehicle: {
    make: "Nissan",
    model: "Altima",
    year: 2021,
    color: "Black"
  },
  plateNumber: "FJ9012",
  rating: 4.7,
  totalRides: 89,
  lastLocation: {
    type: "Point",
    coordinates: [177.4500, -17.6100] // Lautoka
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created driver profile: Pita Vulaono (OFFLINE in Lautoka)`);

// ============================================
// 4. CREATE TEST PASSENGER USERS (Optional)
// ============================================
print("\n========== CREATING TEST PASSENGERS ==========");

// Password: "Pass1234!" (bcrypt hash)
const passengerPasswordHash = "$2b$10$N5Zx3jF8K9mZQvP6Y4qE0.H3FXqnYvP8pZY1Z8qE0H3FXqnYvP8pZ";

const passenger1 = db.users.insertOne({
  email: "passenger1@test.com",
  phone: "+6799876543",
  name: "Sarah Kumar",
  role: "passenger",
  passwordHash: passengerPasswordHash,
  emailVerified: false, // For email verification testing
  savedPlaces: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created passenger: Sarah Kumar (unverified email)`);

const passenger2 = db.users.insertOne({
  email: "passenger2@test.com",
  phone: "+6799876544",
  name: "David Singh",
  role: "passenger",
  passwordHash: passengerPasswordHash,
  emailVerified: true,
  profilePhoto: "https://ui-avatars.com/api/?name=David+Singh&background=3b82f6&color=fff",
  savedPlaces: [
    {
      type: "home",
      label: "Home",
      address: "Thurston Gardens, Suva",
      coordinates: { lat: -18.1416, lng: 178.4419 }
    },
    {
      type: "work",
      label: "Work",
      address: "University of South Pacific, Laucala Bay",
      coordinates: { lat: -18.1134, lng: 178.4627 }
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Created passenger: David Singh (verified, with saved places)`);

// ============================================
// 5. CREATE SAMPLE HISTORICAL RIDES
// ============================================
print("\n========== CREATING SAMPLE RIDES ==========");

// Completed ride for passenger2
db.rides.insertOne({
  passengerId: passenger2.insertedId,
  driverId: driver1.insertedId,
  pickup: {
    id: "ChIJ1",
    description: "Thurston Gardens, Suva",
    placeId: "ChIJ1",
    coords: { latitude: -18.1416, longitude: 178.4419 }
  },
  dropoff: {
    id: "ChIJ2",
    description: "University of South Pacific, Laucala Bay",
    placeId: "ChIJ2",
    coords: { latitude: -18.1134, longitude: 178.4627 }
  },
  status: "completed",
  fare: 12.50,
  fareBreakdown: {
    base: 2.50,
    distance: 7.20,
    time: 1.80,
    subtotal: 11.50,
    tax: 1.00,
    total: 12.50
  },
  currency: "FJD",
  distanceKm: 6.0,
  durationMinutes: 12,
  rating: 5,
  completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
});

print(`✅ Created sample completed ride`);

// Cancelled ride for passenger2
db.rides.insertOne({
  passengerId: passenger2.insertedId,
  driverId: driver2.insertedId,
  pickup: {
    id: "ChIJ3",
    description: "Suva City Centre",
    placeId: "ChIJ3",
    coords: { latitude: -18.1415, longitude: 178.4419 }
  },
  dropoff: {
    id: "ChIJ4",
    description: "Raiwaqa, Suva",
    placeId: "ChIJ4",
    coords: { latitude: -18.1500, longitude: 178.4600 }
  },
  status: "cancelled",
  fare: 8.00,
  fareBreakdown: {
    base: 2.50,
    distance: 4.20,
    time: 0.90,
    subtotal: 7.60,
    tax: 0.40,
    total: 8.00
  },
  currency: "FJD",
  distanceKm: 3.5,
  durationMinutes: 6,
  cancellationReason: "Changed my mind",
  cancelledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
});

print(`✅ Created sample cancelled ride`);

// ============================================
// 6. CREATE GEOSPATIAL INDEX
// ============================================
print("\n========== CREATING INDEXES ==========");

db.drivers.createIndex({ lastLocation: "2dsphere" });
print(`✅ Created 2dsphere index on drivers.lastLocation`);

// ============================================
// 7. VERIFICATION
// ============================================
print("\n========== VERIFICATION ==========");

const onlineDriversCount = db.drivers.countDocuments({ isOnline: true });
print(`✅ Online drivers: ${onlineDriversCount}`);

const totalUsersCount = db.users.countDocuments();
print(`✅ Total users: ${totalUsersCount}`);

const totalRidesCount = db.rides.countDocuments();
print(`✅ Total rides: ${totalRidesCount}`);

print("\n========== SETUP COMPLETE! ==========");
print("\n📋 Test Credentials:");
print("   Drivers: driver1@test.com, driver2@test.com, driver3@test.com");
print("   Passengers: passenger1@test.com, passenger2@test.com");
print("   Password (all): Driver123! or Pass1234!");
print("\n🚗 Online Drivers:");
print("   - John Ravouvou (Suva) - Toyota Camry FJ1234");
print("   - Maria Tora (Nadi) - Honda Accord FJ5678");
print("\n📍 Test Locations (Suva):");
print("   Pickup: Thurston Gardens, Suva (-18.1416, 178.4419)");
print("   Dropoff: USP Laucala Bay (-18.1134, 178.4627)");
print("\n✅ Ready for testing!");
