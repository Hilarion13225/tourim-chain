import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@/app/generated/prisma/enums';
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
    const { eventId, quantity } = body as {
      eventId?: string;
      quantity?: number;
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
          status: PaymentStatus.PAID,
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
