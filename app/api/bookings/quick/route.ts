import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type PaymentMethod =
  | 'MOBILE_MONEY'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CASH_ON_SERVICE';

const allowedPaymentMethods: PaymentMethod[] = [
  'MOBILE_MONEY',
  'CARD',
  'BANK_TRANSFER',
  'CASH_ON_SERVICE',
];

function isValidPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === 'string' &&
    allowedPaymentMethods.includes(value as PaymentMethod)
  );
}

type GuideMeta = {
  guideId?: string;
};

function readGuideIdFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const guideId = (metadata as GuideMeta).guideId;
  return typeof guideId === 'string' && guideId ? guideId : null;
}

async function findGuideForTourismSite(siteId?: string) {
  if (siteId) {
    const links = await prisma.adminAction.findMany({
      where: {
        targetType: 'TOURIST_SITE',
        targetId: siteId,
        action: 'SITE_GUIDE_AFFILIATION',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        metadata: true,
      },
    });

    const principalGuideId = links
      .map((item) => readGuideIdFromMetadata(item.metadata))
      .find((value): value is string => Boolean(value));

    if (principalGuideId) {
      const affiliatedGuide = await prisma.user.findFirst({
        where: {
          id: principalGuideId,
          role: 'GUIDE',
          status: 'ACTIVE',
          verified: true,
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (affiliatedGuide) {
        return affiliatedGuide.id;
      }

      const affiliatedFallbackGuide = await prisma.user.findFirst({
        where: {
          id: principalGuideId,
          role: 'GUIDE',
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });

      if (affiliatedFallbackGuide) {
        return affiliatedFallbackGuide.id;
      }
    }
  }

  let siteRegion: string | null = null;

  if (siteId) {
    const site = await prisma.touristSite.findUnique({
      where: { id: siteId },
      select: { region: true },
    });

    siteRegion = site?.region ?? null;
  }

  if (siteRegion) {
    const regionGuide = await prisma.user.findFirst({
      where: {
        role: 'GUIDE',
        status: 'ACTIVE',
        verified: true,
        guideProfile: {
          is: {
            region: { contains: siteRegion, mode: 'insensitive' },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    if (regionGuide) {
      return regionGuide.id;
    }
  }

  const activeGuide = await prisma.user.findFirst({
    where: {
      role: 'GUIDE',
      status: 'ACTIVE',
      verified: true,
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  if (activeGuide) {
    return activeGuide.id;
  }

  const fallbackGuide = await prisma.user.findFirst({
    where: { role: 'GUIDE' },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });

  return fallbackGuide?.id ?? null;
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
    const {
      siteId,
      participants,
      date,
      amount,
      fullName,
      phone,
      email,
      address,
      paymentMethod,
      notes,
    } = body as {
      siteId?: string;
      participants?: number;
      date?: string;
      amount?: number;
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      paymentMethod?: PaymentMethod;
      notes?: string;
    };

    if (!isValidPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: 'moyen de paiement invalide ou manquant' },
        { status: 400 },
      );
    }

    const guideId = await findGuideForTourismSite(siteId);

    if (!guideId) {
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
    const unitAmount = amount && amount > 0 ? amount : 25000;
    const totalAmount = unitAmount * safeParticipants;

    const detailsNotes = [
      siteId ? `Site: ${siteId}` : null,
      fullName ? `Nom: ${fullName}` : null,
      phone ? `Téléphone: ${phone}` : null,
      email ? `Email: ${email}` : null,
      address ? `Adresse/RDV: ${address}` : null,
      paymentMethod ? `Paiement: ${paymentMethod}` : null,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join(' | ');

    const booking = await prisma.booking.create({
      data: {
        touristId: payload.userId,
        guideId,
        date: targetDate,
        participants: safeParticipants,
        totalAmount,
        notes: detailsNotes || 'Réservation rapide',
      },
      select: {
        id: true,
        date: true,
        participants: true,
        totalAmount: true,
      },
    });

    await trackEvent({
      userId: payload.userId,
      eventType: 'reservation_created',
      module: siteId ? 'TOURISME' : 'GENERIC_BOOKING',
      amount: totalAmount,
      success: true,
      metadata: {
        bookingId: booking.id,
        participants: safeParticipants,
        paymentMethod,
      },
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bookings/quick', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
