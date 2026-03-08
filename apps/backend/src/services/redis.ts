/**
 * Redis client service for caching, OTP storage, and session management
 * Uses ioredis with graceful degradation - app continues if Redis unavailable
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 * Falls back gracefully if REDIS_URL not provided or connection fails
 */
export function initRedis(): void {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not set. Using in-memory storage (NOT recommended for production)');
    return;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('❌ Redis connection failed after 3 retries');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true; // Reconnect on readonly error
        }
        return false;
      },
    });

    redisClient.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Redis connected');
    });

    redisClient.on('error', (err) => {
      isRedisAvailable = false;
      console.error('❌ Redis error:', err.message);
    });

    redisClient.on('close', () => {
      isRedisAvailable = false;
      console.warn('⚠️  Redis connection closed');
    });

  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    redisClient = null;
  }
}

/**
 * Get Redis client instance
 * Returns null if Redis is not available
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Set a key with expiry (TTL in seconds)
 */
export async function setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) {
    return false;
  }

  try {
    await redisClient.setex(key, ttlSeconds, value);
    return true;
  } catch (error) {
    console.error(`Redis SETEX error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get a key's value
 */
export async function get(key: string): Promise<string | null> {
  if (!isRedisConnected() || !redisClient) {
    return null;
  }

  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a key
 */
export async function del(key: string): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
    return false;
  }
}

/**
 * Check if a key exists
 */
export async function exists(key: string): Promise<boolean> {
  if (!isRedisConnected() || !redisClient) {
    return false;
  }

  try {
    const result = await redisClient.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    console.log('✅ Redis connection closed gracefully');
  }
}
