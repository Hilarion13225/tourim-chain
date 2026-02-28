import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guideUserId = searchParams.get('guideUserId') ?? undefined;

    const availabilities = await prisma.guideAvailability.findMany({
      where: {
        ...(guideUserId
          ? {
              guideProfile: {
                userId: guideUserId,
              },
            }
          : {}),
      },
      include: {
        guideProfile: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startAt: 'asc' }],
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error('GET /api/guide-availabilities', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guideUserId, date, startAt, endAt, isAvailable } = body as {
      guideUserId?: string;
      date?: string;
      startAt?: string;
      endAt?: string;
      isAvailable?: boolean;
    };

    if (!guideUserId || !date || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'guideUserId, date, startAt et endAt sont requis' },
        { status: 400 },
      );
    }

    const guideProfile = await prisma.guideProfile.findUnique({
      where: { userId: guideUserId },
      select: { id: true },
    });

    if (!guideProfile) {
      return NextResponse.json(
        { error: 'profil guide introuvable' },
        { status: 404 },
      );
    }

    const availability = await prisma.guideAvailability.create({
      data: {
        guideProfileId: guideProfile.id,
        date: new Date(date),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isAvailable: isAvailable ?? true,
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error('POST /api/guide-availabilities', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
