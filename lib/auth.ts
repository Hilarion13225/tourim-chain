import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_EXPIRES_IN = '7d';

export type AuthTokenPayload = {
  userId: string;
  email: string;
  role: string;
};

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    if (process.env.NODE_ENV !== 'production') {
      return 'dev-insecure-jwt-secret';
    }

    throw new Error('JWT_SECRET is missing in environment variables');
  }

  return jwtSecret;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(payload: {
  userId: string;
  email: string;
  role: string;
}) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAccessToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function getDashboardPathByRole(role: string) {
  if (role === 'GUIDE') {
    return '/dashboard/guide';
  }

  if (role === 'ARTISAN') {
    return '/dashboard/artisan';
  }

  if (role === 'ORGANIZER') {
    return '/dashboard/organisateur';
  }

  if (role === 'ACCOMMODATION_COMPANY') {
    return '/dashboard/hebergement';
  }

  if (role === 'VEHICLE_RENTAL_COMPANY') {
    return '/dashboard/location-vehicule';
  }

  if (role === 'ADMIN') {
    return '/dashboard/admin';
  }

  return '/dashboard/touriste';
}
