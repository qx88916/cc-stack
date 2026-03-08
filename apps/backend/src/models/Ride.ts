import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  id: String,
  description: String,
  placeId: String,
  coords: {
    latitude: Number,
    longitude: Number,
  },
}, { _id: false });

const fareBreakdownSchema = new mongoose.Schema({
  baseFare: { type: Number, default: 0 },
  distanceCharge: { type: Number, default: 0 },
  timeCharge: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  surge: { type: Number, default: 0 },
  surgeMultiplier: { type: Number, default: 1 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
}, { _id: false });

const rideSchema = new mongoose.Schema({
  passengerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  pickup: { type: placeSchema, required: true },
  dropoff: { type: placeSchema, required: true },
  status: {
    type: String,
    enum: ['searching', 'accepted', 'arriving', 'ongoing', 'completed', 'cancelled'],
    default: 'searching',
  },
  fare: { type: Number, required: true },
  fareBreakdown: { type: fareBreakdownSchema, default: undefined },
  currency: { type: String, default: 'USD' },
  distanceKm: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  paymentMethod: { type: String, enum: ['cash', 'mpaisa'], default: 'cash' },
}, { timestamps: true });

rideSchema.index({ passengerId: 1, status: 1 });
rideSchema.index({ driverId: 1, status: 1 });
rideSchema.index({ status: 1 });

export const RideModel = mongoose.model('Ride', rideSchema);
