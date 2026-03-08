/**
 * Idempotency middleware to prevent duplicate requests
 * Uses Redis for distributed systems or in-memory for single instance
 */

import { Request, Response, NextFunction } from 'express';
import { setWithExpiry, exists, isRedisConnected } from '../services/redis';

// In-memory fallback for idempotency keys
const processedKeys = new Map<string, { timestamp: number; response: any }>();
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const IDEMPOTENCY_TTL_MS = IDEMPOTENCY_TTL_SECONDS * 1000;

// Clean up old in-memory keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of processedKeys.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL_MS) {
      processedKeys.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean every hour

/**
 * Check if idempotency key has been processed before
 */
async function hasBeenProcessed(key: string): Promise<boolean> {
  // Try Redis first
  if (isRedisConnected()) {
    const redisKey = `idempotency:${key}`;
    return await exists(redisKey);
  }

  // Fallback to in-memory
  const entry = processedKeys.get(key);
  if (!entry) return false;

  // Check if expired
  if (Date.now() - entry.timestamp > IDEMPOTENCY_TTL_MS) {
    processedKeys.delete(key);
    return false;
  }

  return true;
}

/**
 * Mark idempotency key as processed
 */
async function markAsProcessed(key: string, response: any): Promise<void> {
  // Try Redis first
  if (isRedisConnected()) {
    const redisKey = `idempotency:${key}`;
    await setWithExpiry(redisKey, JSON.stringify(response), IDEMPOTENCY_TTL_SECONDS);
    return;
  }

  // Fallback to in-memory
  processedKeys.set(key, {
    timestamp: Date.now(),
    response,
  });
}

/**
 * Idempotency middleware
 * Requires 'Idempotency-Key' header (UUID recommended)
 */
export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    res.status(400).json({
      message: 'Idempotency-Key header is required for this request',
    });
    return;
  }

  // Validate format (should be UUID or similar)
  if (idempotencyKey.length < 10 || idempotencyKey.length > 100) {
    res.status(400).json({
      message: 'Invalid Idempotency-Key format',
    });
    return;
  }

  // Check if already processed
  hasBeenProcessed(idempotencyKey)
    .then((processed) => {
      if (processed) {
        console.warn(`⚠️  Duplicate request detected: ${idempotencyKey}`);
        res.status(409).json({
          message: 'Duplicate request. This operation has already been processed.',
        });
        return;
      }

      // Store the idempotency key and intercept response
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Only store successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          markAsProcessed(idempotencyKey, body).catch((err) => {
            console.error('Failed to mark idempotency key as processed:', err);
          });
        }
        return originalJson(body);
      };

      next();
    })
    .catch((err) => {
      console.error('Idempotency check error:', err);
      // Continue on error to avoid breaking the request
      next();
    });
}
