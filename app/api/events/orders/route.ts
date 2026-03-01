import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@/app/generated/prisma/enums';
import { trackEvent } from '@/lib/analytics';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
}

function generateQrCode(eventId: string, index: number) {
  return `evt_${eventId}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseEventItemType(description: string) {
  if (!description.startsWith('__ORG_META__')) {
    return 'EVENT';
  }

  const firstLineBreak = description.indexOf('\n');
  const metaLine =
    firstLineBreak >= 0 ? description.slice(0, firstLineBreak) : description;
  const rawJson = metaLine.replace('__ORG_META__', '');

  try {
    const parsed = JSON.parse(rawJson) as { itemType?: 'ACTIVITY' | 'EVENT' };
    return parsed.itemType ?? 'EVENT';
  } catch {
    return 'EVENT';
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'non authentifié' }, { status: 401 });
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'token invalide' }, { status: 401 });
    }

    const whereClause =
      payload.role === 'ADMIN' ? {} : { touristId: payload.userId };

    const orders = await prisma.eventOrder.findMany({
      where: whereClause,
      orderBy: { orderedAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            nom: true,
            photoUrl: true,
            description: true,
            startAt: true,
          },
        },
        tickets: {
          select: { id: true },
        },
      },
    });

    const serialized = orders.map((order) => ({
      id: order.id,
      eventId: order.event.id,
      eventName: order.event.nom,
      eventPhotoUrl: order.event.photoUrl,
      itemType: parseEventItemType(order.event.description),
      participants: order.tickets.length,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      orderedAt: order.orderedAt,
      eventStartAt: order.event.startAt,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error('GET /api/events/orders', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

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
    const { eventId, quantity, autoPaid } = body as {
      eventId?: string;
      quantity?: number;
      autoPaid?: boolean;
    };

    if (!eventId) {
      return NextResponse.json({ error: 'eventId requis' }, { status: 400 });
    }

    const safeQuantity = quantity && quantity > 0 ? quantity : 1;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketTypes: { orderBy: { prix: 'asc' } } },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'événement introuvable' },
        { status: 404 },
      );
    }

    const ticketType = event.ticketTypes[0];

    if (!ticketType) {
      return NextResponse.json(
        { error: 'aucun type de billet disponible' },
        { status: 400 },
      );
    }

    const remaining = ticketType.quantityTotal - ticketType.quantitySold;

    if (remaining < safeQuantity) {
      return NextResponse.json(
        { error: 'stock billets insuffisant' },
        { status: 400 },
      );
    }

    const unitPrice = toNumber(ticketType.prix);
    const totalAmount = unitPrice * safeQuantity;

    const result = await prisma.$transaction(async (trx) => {
      const order = await trx.eventOrder.create({
        data: {
          eventId,
          touristId: payload.userId,
          totalAmount,
          status:
            autoPaid === false ? PaymentStatus.UNPAID : PaymentStatus.PAID,
          tickets: {
            create: Array.from({ length: safeQuantity }).map((_, index) => ({
              ticketTypeId: ticketType.id,
              qrCode: generateQrCode(eventId, index),
            })),
          },
        },
        include: {
          tickets: true,
        },
      });

      await trx.eventTicketType.update({
        where: { id: ticketType.id },
        data: {
          quantitySold: {
            increment: safeQuantity,
          },
        },
      });

      return order;
    });

    await trackEvent({
      userId: payload.userId,
      eventType: 'event_order_created',
      module:
        parseEventItemType(event.description) === 'ACTIVITY'
          ? 'SPORT_ACTIVITE'
          : 'SPORT_EVENEMENT',
      amount: totalAmount,
      success: true,
      metadata: {
        orderId: result.id,
        eventId,
        quantity: safeQuantity,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: result.id,
        totalAmount,
        tickets: result.tickets.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/events/orders', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
