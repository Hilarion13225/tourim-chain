import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { siteId, participants, date } = body as {
      siteId?: string;
      participants?: number;
      date?: string;
    };

    const guide = await prisma.user.findFirst({
      where: { role: 'GUIDE' },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (!guide) {
      return NextResponse.json(
        { error: 'aucun guide disponible' },
        { status: 400 },
      );
    }

    const safeParticipants =
      participants && participants > 0 ? participants : 1;
    const targetDate = date
      ? new Date(date)
      : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const totalAmount = 25000 * safeParticipants;

    const booking = await prisma.booking.create({
      data: {
        touristId: payload.userId,
        guideId: guide.id,
        date: targetDate,
        participants: safeParticipants,
        totalAmount,
        notes: siteId
          ? `Réservation depuis le site ${siteId}`
          : 'Réservation rapide',
      },
      select: {
        id: true,
        date: true,
        participants: true,
        totalAmount: true,
      },
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings/quick', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
