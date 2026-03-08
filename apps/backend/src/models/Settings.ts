import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    fare: {
      baseFare: { type: Number, required: true, default: 5.0 },
      perKmRate: { type: Number, required: true, default: 1.5 },
      perMinuteRate: { type: Number, required: true, default: 0.5 },
      minimumFare: { type: Number, required: true, default: 5.0 },
      surgeMultiplier: { type: Number, required: true, default: 1.0 },
      taxRate: { type: Number, required: true, default: 0.1 }, // 10%
    },
    geofence: {
      enabled: { type: Boolean, default: true },
      maxDistanceKm: { type: Number, default: 50 },
      centerCoordinates: {
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
      },
      radiusKm: { type: Number, default: 30 },
    },
    general: {
      appName: { type: String, default: 'CabConnect' },
      supportEmail: { type: String, default: 'support@cabconnect.com' },
      supportPhone: { type: String, default: '+1-000-000-0000' },
      maintenanceMode: { type: Boolean, default: false },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Ensure only one settings document exists (singleton pattern)
settingsSchema.index({ _id: 1 }, { unique: true });

export const SettingsModel = mongoose.model('Settings', settingsSchema);

// Helper function to get or create settings
export async function getSettings() {
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({});
  }
  return settings;
}

// Helper function to update settings
export async function updateSettings(updates: any, updatedBy: string) {
  const settings = await getSettings();
  Object.assign(settings, updates);
  settings.updatedBy = new mongoose.Types.ObjectId(updatedBy);
  await settings.save();
  return settings;
}
