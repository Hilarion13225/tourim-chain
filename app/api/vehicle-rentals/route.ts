import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canManage(role: string) {
  return role === 'VEHICLE_RENTAL_COMPANY' || role === 'ADMIN';
}

function isUnknownPhotoUrlArgumentError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Unknown argument `photoUrl`');
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const listings = await prisma.vehicleRentalListing.findMany({
        where: { disponible: true },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(listings);
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (!canManage(auth.role)) {
      const listings = await prisma.vehicleRentalListing.findMany({
        where: { disponible: true },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(listings);
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') ?? undefined;

    const listings = await prisma.vehicleRentalListing.findMany({
      where:
        auth.role === 'ADMIN'
          ? {
              ...(ownerId ? { ownerId } : {}),
            }
          : {
              ownerId: auth.userId,
            },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(listings);
  } catch (error) {
    console.error('GET /api/vehicle-rentals', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (!canManage(auth.role)) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = await request.json();
    const {
      nom,
      photoUrl,
      description,
      ville,
      type,
      transmission,
      prixParJour,
      climatisation,
      disponible,
    } = body as {
      nom?: string;
      photoUrl?: string;
      description?: string;
      ville?: string;
      type?: string;
      transmission?: string;
      prixParJour?: number;
      climatisation?: boolean;
      disponible?: boolean;
    };

    if (!nom || !ville || !type || !transmission || prixParJour === undefined) {
      return NextResponse.json(
        {
          error: 'nom, ville, type, transmission et prixParJour sont requis',
        },
        { status: 400 },
      );
    }

    const createData = {
      ownerId: auth.userId,
      nom,
      photoUrl,
      description,
      ville,
      type,
      transmission,
      prixParJour: toNumber(prixParJour, 0),
      climatisation: climatisation ?? false,
      disponible: disponible ?? true,
    };

    let listing;

    try {
      listing = await prisma.vehicleRentalListing.create({
        data: createData,
      });
    } catch (error) {
      if (!isUnknownPhotoUrlArgumentError(error)) {
        throw error;
      }

      const fallbackData = { ...createData };
      delete fallbackData.photoUrl;

      listing = await prisma.vehicleRentalListing.create({
        data: fallbackData,
      });
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicle-rentals', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
