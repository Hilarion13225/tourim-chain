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

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        ticketTypes: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'événement introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('GET /api/events/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const {
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

    if (status && !isValidEventStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const updateData = {
      ...(nom ? { nom } : {}),
      ...(photoUrl !== undefined ? { photoUrl } : {}),
      ...(description ? { description } : {}),
      ...(lieu ? { lieu } : {}),
      ...(region ? { region } : {}),
      ...(startAt ? { startAt: new Date(startAt) } : {}),
      ...(endAt ? { endAt: new Date(endAt) } : {}),
      ...(capacity !== undefined ? { capacity } : {}),
      ...(status && isValidEventStatus(status) ? { status } : {}),
    };

    let updatedEvent;

    try {
      updatedEvent = await prisma.event.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (!isUnknownPhotoUrlArgumentError(error) || photoUrl === undefined) {
        throw error;
      }

      const fallbackData = { ...updateData };
      delete fallbackData.photoUrl;

      updatedEvent = await prisma.event.update({
        where: { id },
        data: fallbackData,
      });
    }

    if (ticketPrice !== undefined) {
      const standardTicket = await prisma.eventTicketType.findFirst({
        where: { eventId: id },
        orderBy: { createdAt: 'asc' },
      });

      if (standardTicket) {
        await prisma.eventTicketType.update({
          where: { id: standardTicket.id },
          data: {
            prix: ticketPrice,
            ...(capacity !== undefined ? { quantityTotal: capacity } : {}),
          },
        });
      } else {
        await prisma.eventTicketType.create({
          data: {
            eventId: id,
            nom: 'Standard',
            prix: ticketPrice,
            quantityTotal: capacity ?? 100,
          },
        });
      }
    }

    const reloaded = await prisma.event.findUnique({
      where: { id: updatedEvent.id },
      include: {
        ticketTypes: true,
      },
    });

    return NextResponse.json(reloaded ?? updatedEvent);
  } catch (error) {
    console.error('PATCH /api/events/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/events/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
