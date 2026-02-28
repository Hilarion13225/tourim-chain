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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    const existing = await prisma.vehicleRentalListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'véhicule introuvable' },
        { status: 404 },
      );
    }

    if (auth.role !== 'ADMIN' && existing.ownerId !== auth.userId) {
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

    const updateData = {
      ...(nom !== undefined ? { nom } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(ville !== undefined ? { ville } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(transmission !== undefined ? { transmission } : {}),
      ...(prixParJour !== undefined
        ? { prixParJour: toNumber(prixParJour, 0) }
        : {}),
      ...(climatisation !== undefined ? { climatisation } : {}),
      ...(disponible !== undefined ? { disponible } : {}),
    };

    let updated;

    try {
      updated = await prisma.vehicleRentalListing.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (!isUnknownPhotoUrlArgumentError(error) || photoUrl === undefined) {
        throw error;
      }

      const fallbackData = { ...updateData };
      delete fallbackData.photoUrl;

      updated = await prisma.vehicleRentalListing.update({
        where: { id },
        data: fallbackData,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/vehicle-rentals/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
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

    const { id } = await context.params;

    const existing = await prisma.vehicleRentalListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'véhicule introuvable' },
        { status: 404 },
      );
    }

    if (auth.role !== 'ADMIN' && existing.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    await prisma.vehicleRentalListing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/vehicle-rentals/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
