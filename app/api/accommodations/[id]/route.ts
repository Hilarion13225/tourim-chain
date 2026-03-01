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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const token = request.cookies.get('auth_token')?.value;

    const listing = await prisma.accommodationListing.findUnique({
      where: { id },
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'hébergement introuvable' },
        { status: 404 },
      );
    }

    if (listing.isActive) {
      return NextResponse.json(listing);
    }

    if (!token) {
      return NextResponse.json(
        { error: 'hébergement introuvable' },
        { status: 404 },
      );
    }

    const auth = verifyAccessToken(token);

    if (!auth) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    if (auth.role === 'ADMIN' || auth.userId === listing.ownerId) {
      return NextResponse.json(listing);
    }

    return NextResponse.json(
      { error: 'hébergement introuvable' },
      { status: 404 },
    );
  } catch (error) {
    console.error('GET /api/accommodations/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
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

    const existing = await prisma.accommodationListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'hébergement introuvable' },
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

    const updated = await prisma.accommodationListing.update({
      where: { id },
      data: {
        ...(nom !== undefined ? { nom } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(ville !== undefined ? { ville } : {}),
        ...(region !== undefined ? { region } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(note !== undefined ? { note: toNumber(note, 8.9) } : {}),
        ...(petitDejeuner !== undefined ? { petitDejeuner } : {}),
        ...(prixParNuit !== undefined
          ? { prixParNuit: toNumber(prixParNuit, 0) }
          : {}),
        ...(capacite !== undefined
          ? { capacite: Math.max(1, Math.floor(toNumber(capacite, 1))) }
          : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/accommodations/[id]', error);
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

    const existing = await prisma.accommodationListing.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'hébergement introuvable' },
        { status: 404 },
      );
    }

    if (auth.role !== 'ADMIN' && existing.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    await prisma.accommodationListing.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/accommodations/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
