import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authMiddleware, requirePassenger, AuthReq } from '../middleware/auth';
import { UserModel, verifyPassword } from '../models/User';

const router = express.Router();

// ============================================
// Cloudinary + Multer configuration
// ============================================

// Configure Cloudinary (reads from CLOUDINARY_URL env, or individual vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  console.log('✅ Cloudinary configured for profile photo uploads');
} else {
  console.warn('⚠️ Cloudinary not configured — profile photo uploads will fail. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.');
}

// Use memory storage so we get a buffer to upload to Cloudinary
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG images are allowed.'));
  }
};

// Configure multer with memory storage
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// ============================================
// Routes
// ============================================

/**
 * PATCH /user/profile-photo
 * Upload profile photo
 * Requires authentication
 */
router.patch('/profile-photo', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo file provided',
      });
    }

    if (!isCloudinaryConfigured) {
      return res.status(503).json({
        success: false,
        message: 'Photo upload service is not configured. Please contact support.',
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete old photo from Cloudinary if it was a Cloudinary URL
    if (user.profilePhoto && user.profilePhoto.includes('cloudinary.com')) {
      try {
        const urlParts = user.profilePhoto.split('/');
        const folderAndFile = urlParts.slice(-2).join('/');
        const publicId = folderAndFile.replace(/\.\w+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Error deleting old Cloudinary photo:', err);
      }
    }

    // Upload buffer to Cloudinary via stream
    const uploadResult: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'cabconnect',
          public_id: `profile-${userId}`,
          overwrite: true,
          resource_type: 'image',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file!.buffer);
    });

    const photoUrl = uploadResult.secure_url;

    user.profilePhoto = photoUrl;
    await user.save();

    console.log(`Profile photo updated for user ${userId}: ${photoUrl}`);

    res.json({
      success: true,
      photoUrl,
      message: 'Profile photo updated successfully',
    });
  } catch (error) {
    console.error('Error uploading profile photo:', error);

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.',
        });
      }
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload profile photo',
    });
  }
});

/**
 * PATCH /user/profile
 * Update user profile (name, phone)
 * Requires authentication
 */
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    const { name, phone } = req.body;

    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    
    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields to update' 
      });
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ Profile updated for user ${userId}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
});

/**
 * GET /user/profile
 * Get current user profile
 * Requires authentication
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
});

/**
 * GET /user/saved-places
 * Get user's saved places
 * Requires authentication
 */
router.get('/saved-places', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    const user = await UserModel.findById(userId).select('savedPlaces');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      places: user.savedPlaces || [],
    });
  } catch (error) {
    console.error('Error fetching saved places:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch saved places' 
    });
  }
});

/**
 * POST /user/saved-places
 * Add or update a saved place
 * Requires authentication
 */
router.post('/saved-places', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    const { type, place } = req.body;

    if (!type || !place) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and place data required' 
      });
    }

    if (!['home', 'work', 'custom'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid place type' 
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Initialize savedPlaces array if not exists
    if (!user.savedPlaces) {
      user.savedPlaces = [] as any;
    }

    // Remove existing place of same type
    user.savedPlaces = user.savedPlaces.filter((p: any) => p.type !== type) as any;

    // Add new place
    user.savedPlaces.push({
      type,
      label: place.label,
      address: place.address,
      coordinates: {
        lat: place.latitude,
        lng: place.longitude,
      },
    });

    await user.save();

    console.log(`✅ Saved place added for user ${userId}: ${type}`);

    res.json({
      success: true,
      message: 'Place saved successfully',
      places: user.savedPlaces,
    });
  } catch (error) {
    console.error('Error saving place:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save place' 
    });
  }
});

/**
 * DELETE /user/saved-places/:type
 * Delete a saved place
 * Requires authentication
 */
router.delete('/saved-places/:type', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    const { type } = req.params;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    if (!user.savedPlaces) {
      return res.status(404).json({ 
        success: false, 
        message: 'No saved places found' 
      });
    }

    // Remove place
    user.savedPlaces = user.savedPlaces.filter((p: any) => p.type !== type) as any;
    await user.save();

    console.log(`✅ Saved place deleted for user ${userId}: ${type}`);

    res.json({
      success: true,
      message: 'Place deleted successfully',
      places: user.savedPlaces,
    });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete place' 
    });
  }
});

/**
 * POST /user/verify-email
 * Mark user's email as verified
 * Requires authentication
 */
router.post('/verify-email', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { emailVerified: true } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ Email verified for user ${userId}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify email' 
    });
  }
});

/**
 * DELETE /user/account
 * Soft-delete user account
 * Requires authentication and password confirmation
 */
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = (req as AuthReq).userId;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete your account',
      });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify password
    if (!user.passwordHash) {
      return res.status(400).json({
        success: false,
        message: 'Cannot verify identity. Please contact support.',
      });
    }

    const passwordValid = await verifyPassword(String(password), user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      });
    }

    // Soft delete: mark as deleted instead of removing
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    console.log(`✅ Account soft-deleted for user ${userId}`);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

router.post('/push-token', authMiddleware, requirePassenger, async (req: AuthReq, res) => {
  try {
    const { pushToken } = req.body ?? {};
    if (!pushToken || typeof pushToken !== 'string') {
      return res.status(400).json({ message: 'pushToken required' });
    }
    await UserModel.findByIdAndUpdate(req.userId, { $set: { pushToken } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Server error' });
  }
});

export { router as userRouter };
