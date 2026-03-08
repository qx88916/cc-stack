import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';

// CRITICAL: Enforce JWT_SECRET - no fallback allowed
const _jwtSecret = process.env.JWT_SECRET;

if (!_jwtSecret) {
  throw new Error(
    '❌ FATAL: JWT_SECRET environment variable is not set!\n' +
    '   Generate a secure secret:\n' +
    '   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n' +
    '   Then add to .env: JWT_SECRET=<generated_value>'
  );
}

if (_jwtSecret.length < 32) {
  throw new Error(
    `❌ FATAL: JWT_SECRET is too weak (${_jwtSecret.length} chars)!\n` +
    '   Must be at least 32 characters for security.\n' +
    '   Generate a secure secret:\n' +
    '   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n'
  );
}

console.log(`✅ JWT_SECRET loaded (${_jwtSecret.length} chars)`);

// After validation, we know this is a valid string
const JWT_SECRET: string = _jwtSecret;

export interface AuthReq extends Request {
  userId?: string;
  user?: { id: string; email: string; role: string };
}

export interface JwtPayload {
  userId: string;
  role: string;
}

export function createToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role } as JwtPayload,
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function getUserIdFromToken(token: string | undefined): { userId: string; role: string } | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
}

export async function authMiddleware(req: AuthReq, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
  const payload = getUserIdFromToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const user = await UserModel.findById(payload.userId).select('email role isDeleted').lean();
  if (!user || (user as any).isDeleted) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  req.userId = payload.userId;
  req.user = {
    id: payload.userId,
    email: user.email ?? '',
    role: (user.role as string) ?? 'passenger',
  };
  next();
}

export function requirePassenger(req: AuthReq, res: Response, next: NextFunction) {
  if (req.user?.role !== 'passenger') {
    return res.status(403).json({ message: 'Access denied. Passenger only.' });
  }
  next();
}

export function requireDriver(req: AuthReq, res: Response, next: NextFunction) {
  if (req.user?.role !== 'driver') {
    return res.status(403).json({ message: 'Access denied. Driver only.' });
  }
  next();
}

export function requireAdmin(req: AuthReq, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
}
