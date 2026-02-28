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
    const { nom, description, lieu, region, startAt, endAt, capacity, status } =
      body as {
        nom?: string;
        description?: string;
        lieu?: string;
        region?: string;
        startAt?: string;
        endAt?: string;
        capacity?: number;
        status?: string;
      };

    if (status && !isValidEventStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        ...(nom ? { nom } : {}),
        ...(description ? { description } : {}),
        ...(lieu ? { lieu } : {}),
        ...(region ? { region } : {}),
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(status && isValidEventStatus(status) ? { status } : {}),
      },
    });

    return NextResponse.json(updatedEvent);
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
