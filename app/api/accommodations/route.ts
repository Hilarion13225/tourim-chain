import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function canManage(role: string) {
  return role === 'ACCOMMODATION_COMPANY' || role === 'ADMIN';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      const listings = await prisma.accommodationListing.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(listings);
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (!canManage(auth.role)) {
      const listings = await prisma.accommodationListing.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(listings);
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') ?? undefined;

    const listings = await prisma.accommodationListing.findMany({
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
    console.error('GET /api/accommodations', error);
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

    const owner = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'session expirée, reconnectez-vous' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const {
      nom,
      photoUrl,
      description,
      ville,
      region,
      type,
      note,
      petitDejeuner,
      prixParNuit,
      capacite,
      isActive,
    } = body as {
      nom?: string;
      photoUrl?: string;
      description?: string;
      ville?: string;
      region?: string;
      type?: string;
      note?: number;
      petitDejeuner?: boolean;
      prixParNuit?: number;
      capacite?: number;
      isActive?: boolean;
    };

    if (!nom || !ville || !region || !type || prixParNuit === undefined) {
      return NextResponse.json(
        {
          error: 'nom, ville, region, type et prixParNuit sont requis',
        },
        { status: 400 },
      );
    }

    const listing = await prisma.accommodationListing.create({
      data: {
        ownerId: auth.userId,
        nom,
        photoUrl,
        description,
        ville,
        region,
        type,
        note: toNumber(note, 8.9),
        petitDejeuner: petitDejeuner ?? false,
        prixParNuit: toNumber(prixParNuit, 0),
        capacite: Math.max(1, Math.floor(toNumber(capacite, 1))),
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2003'
    ) {
      return NextResponse.json(
        { error: 'session invalide, reconnectez-vous' },
        { status: 401 },
      );
    }

    console.error('POST /api/accommodations', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
