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

function isTransientDbConnectionError(error: unknown) {
  const unknownError = error as {
    code?: string;
    message?: string;
  };
  const message = unknownError?.message?.toLowerCase() ?? '';
  const code = unknownError?.code;

  if (code === 'P1001' || code === 'P1017') {
    return true;
  }

  return (
    message.includes('connection terminated unexpectedly') ||
    message.includes('server has closed the connection') ||
    message.includes('can\'t reach database server')
  );
}

async function findBookingsWithFilters(params: {
  touristId?: string;
  guideId?: string;
  statut?: string;
}) {
  return prisma.booking.findMany({
    where: {
      ...(params.touristId ? { touristId: params.touristId } : {}),
      ...(params.guideId ? { guideId: params.guideId } : {}),
      ...(params.statut && isValidBookingStatus(params.statut)
        ? { statut: params.statut }
        : {}),
    },
    include: {
      tourist: true,
      guide: true,
      circuit: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const touristId = searchParams.get('touristId') ?? undefined;
    const guideId = searchParams.get('guideId') ?? undefined;
    const statut = searchParams.get('statut') ?? undefined;

    let bookings;

    try {
      bookings = await findBookingsWithFilters({ touristId, guideId, statut });
    } catch (error) {
      if (!isTransientDbConnectionError(error)) {
        throw error;
      }

      await prisma.$disconnect().catch(() => undefined);

      try {
        bookings = await findBookingsWithFilters({ touristId, guideId, statut });
      } catch (retryError) {
        if (isTransientDbConnectionError(retryError)) {
          return NextResponse.json(
            {
              error:
                'base de données indisponible, veuillez relancer Prisma/PostgreSQL puis réessayer',
            },
            { status: 503 },
          );
        }

        throw retryError;
      }
    }

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('GET /api/bookings', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      touristId,
      guideId,
      date,
      participants,
      totalAmount,
      circuitId,
      availabilityId,
      notes,
    } = body as {
      touristId?: string;
      guideId?: string;
      date?: string;
      participants?: number;
      totalAmount?: number;
      circuitId?: string;
      availabilityId?: string;
      notes?: string;
    };

    if (!touristId || !guideId || !date || !totalAmount) {
      return NextResponse.json(
        { error: 'touristId, guideId, date et totalAmount sont requis' },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.create({
      data: {
        touristId,
        guideId,
        date: new Date(date),
        participants: participants ?? 1,
        totalAmount,
        circuitId,
        availabilityId,
        notes,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, statut, paymentStatus } = body as {
      id?: string;
      statut?: string;
      paymentStatus?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    if (statut && !isValidBookingStatus(statut)) {
      return NextResponse.json({ error: 'statut invalide' }, { status: 400 });
    }

    if (paymentStatus && !isValidPaymentStatus(paymentStatus)) {
      return NextResponse.json(
        { error: 'paymentStatus invalide' },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...(statut ? { statut: statut as BookingStatus } : {}),
        ...(paymentStatus ? { paymentStatus: paymentStatus as PaymentStatus } : {}),
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('PATCH /api/bookings', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}