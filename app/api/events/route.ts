import { NextRequest, NextResponse } from 'next/server';
import { EventStatus } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidEventStatus(
  value: string,
): value is (typeof EventStatus)[keyof typeof EventStatus] {
  return Object.values(EventStatus).includes(
    value as (typeof EventStatus)[keyof typeof EventStatus],
  );
}

function isUnknownPhotoUrlArgumentError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('Unknown argument `photoUrl`');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? undefined;
    const region = searchParams.get('region') ?? undefined;
    const organisateurId = searchParams.get('organisateurId') ?? undefined;
    const status = searchParams.get('status') ?? 'PUBLISHED';

    const statusFilter =
      status === 'ALL'
        ? {}
        : status && isValidEventStatus(status)
          ? { status }
          : { status: EventStatus.PUBLISHED };

    const events = await prisma.event.findMany({
      where: {
        ...(q
          ? {
              OR: [
                { nom: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { lieu: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(region
          ? { region: { contains: region, mode: 'insensitive' } }
          : {}),
        ...(organisateurId ? { organisateurId } : {}),
        ...statusFilter,
      },
      include: {
        ticketTypes: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('GET /api/events', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organisateurId,
      nom,
      photoUrl,
      description,
      lieu,
      region,
      startAt,
      endAt,
      capacity,
      ticketPrice,
      status,
    } = body as {
      organisateurId?: string;
      nom?: string;
      photoUrl?: string;
      description?: string;
      lieu?: string;
      region?: string;
      startAt?: string;
      endAt?: string;
      capacity?: number;
      ticketPrice?: number;
      status?: string;
    };

    if (
      !organisateurId ||
      !nom ||
      !description ||
      !lieu ||
      !region ||
      !startAt ||
      !endAt ||
      !capacity
    ) {
      return NextResponse.json(
        {
          error:
            'organisateurId, nom, description, lieu, region, startAt, endAt et capacity sont requis',
        },
        { status: 400 },
      );
    }

    if (status && !isValidEventStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const createData = {
      organisateurId,
      nom,
      photoUrl,
      description,
      lieu,
      region,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      capacity,
      ...(ticketPrice !== undefined
        ? {
            ticketTypes: {
              create: {
                nom: 'Standard',
                prix: ticketPrice,
                quantityTotal: capacity,
              },
            },
          }
        : {}),
      ...(status ? { status: status as EventStatus } : {}),
    };

    let event;

    try {
      event = await prisma.event.create({
        data: createData,
        include: {
          ticketTypes: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    } catch (error) {
      if (!isUnknownPhotoUrlArgumentError(error)) {
        throw error;
      }

      const fallbackData = { ...createData };
      delete fallbackData.photoUrl;

      event = await prisma.event.create({
        data: fallbackData,
        include: {
          ticketTypes: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/events', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}