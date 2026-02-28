import { NextRequest, NextResponse } from 'next/server';
import { BookingStatus, PaymentStatus } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidBookingStatus(
  value: string,
): value is (typeof BookingStatus)[keyof typeof BookingStatus] {
  return Object.values(BookingStatus).includes(
    value as (typeof BookingStatus)[keyof typeof BookingStatus],
  );
}

function isValidPaymentStatus(
  value: string,
): value is (typeof PaymentStatus)[keyof typeof PaymentStatus] {
  return Object.values(PaymentStatus).includes(
    value as (typeof PaymentStatus)[keyof typeof PaymentStatus],
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tourist: true,
        guide: true,
        circuit: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'réservation introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('GET /api/bookings/[id]', error);
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
    const { date, participants, totalAmount, statut, paymentStatus, notes } =
      body as {
        date?: string;
        participants?: number;
        totalAmount?: number;
        statut?: string;
        paymentStatus?: string;
        notes?: string | null;
      };

    if (statut && !isValidBookingStatus(statut)) {
      return NextResponse.json({ error: 'statut invalide' }, { status: 400 });
    }

    if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
      return NextResponse.json(
        { error: 'paymentStatus invalide' },
        { status: 400 },
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(participants !== undefined ? { participants } : {}),
        ...(totalAmount !== undefined ? { totalAmount } : {}),
        ...(statut ? { statut } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('PATCH /api/bookings/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bookings/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
