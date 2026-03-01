import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumber(value: unknown) {
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }

  return Number(value ?? 0);
}

function isPrismaMissingTableError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2021'
  );
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

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get('days') ?? '30');
    const windowDays = [7, 30, 90].includes(daysParam) ? daysParam : 30;

    const now = new Date();
    const windowStart = new Date(
      now.getTime() - windowDays * 24 * 60 * 60 * 1000,
    );

    async function safeQuery<T>(
      action: () => Promise<T>,
      fallback: T,
      label: string,
    ) {
      try {
        return await action();
      } catch (error) {
        console.error(`national-analytics:${label}`, error);
        return fallback;
      }
    }

    const totalUsers = await safeQuery(
      () => prisma.user.count(),
      0,
      'totalUsers',
    );
    const totalSites = await safeQuery(
      () => prisma.touristSite.count(),
      0,
      'totalSites',
    );
    const totalEvents = await safeQuery(
      () => prisma.event.count(),
      0,
      'totalEvents',
    );
    const totalBookings = await safeQuery(
      () => prisma.booking.count(),
      0,
      'totalBookings',
    );
    const totalProducts = await safeQuery(
      () => prisma.artisanProduct.count(),
      0,
      'totalProducts',
    );
    const unverifiedActors = await safeQuery(
      () => prisma.user.count({ where: { verified: false } }),
      0,
      'unverifiedActors',
    );

    const tourists = await safeQuery(
      () => prisma.user.count({ where: { role: 'TOURIST' } }),
      0,
      'tourists',
    );
    const guides = await safeQuery(
      () => prisma.user.count({ where: { role: 'GUIDE' } }),
      0,
      'guides',
    );
    const artisans = await safeQuery(
      () => prisma.user.count({ where: { role: 'ARTISAN' } }),
      0,
      'artisans',
    );
    const organizers = await safeQuery(
      () => prisma.user.count({ where: { role: 'ORGANIZER' } }),
      0,
      'organizers',
    );
    const admins = await safeQuery(
      () => prisma.user.count({ where: { role: 'ADMIN' } }),
      0,
      'admins',
    );

    const bookings30d = await safeQuery(
      () =>
        prisma.booking.count({ where: { createdAt: { gte: windowStart } } }),
      0,
      'bookings30d',
    );
    const eventOrders30d = await safeQuery(
      () =>
        prisma.eventOrder.count({
          where: { orderedAt: { gte: windowStart } },
        }),
      0,
      'eventOrders30d',
    );
    const marketplaceOrders30d = await safeQuery(
      () =>
        prisma.marketplaceOrder.count({
          where: { createdAt: { gte: windowStart } },
        }),
      0,
      'marketplaceOrders30d',
    );
    const restaurantOrders30d = await safeQuery(
      () =>
        prisma.restaurantOrder.count({
          where: { createdAt: { gte: windowStart } },
        }),
      0,
      'restaurantOrders30d',
    );

    const bookingsRevenueAgg = await safeQuery(
      () => prisma.booking.aggregate({ _sum: { totalAmount: true } }),
      { _sum: { totalAmount: null } },
      'bookingsRevenueAgg',
    );
    const eventRevenueAgg = await safeQuery(
      () => prisma.eventOrder.aggregate({ _sum: { totalAmount: true } }),
      { _sum: { totalAmount: null } },
      'eventRevenueAgg',
    );
    const marketplaceRevenueAgg = await safeQuery(
      () => prisma.marketplaceOrder.aggregate({ _sum: { totalAmount: true } }),
      { _sum: { totalAmount: null } },
      'marketplaceRevenueAgg',
    );

    const sitesByRegion = await safeQuery(
      () =>
        prisma.touristSite.groupBy({
          by: ['region'],
          _count: { _all: true },
        }),
      [] as Array<{ region: string; _count: { _all: number } }>,
      'sitesByRegion',
    );
    const eventsByRegion = await safeQuery(
      () =>
        prisma.event.groupBy({
          by: ['region'],
          _count: { _all: true },
        }),
      [] as Array<{ region: string; _count: { _all: number } }>,
      'eventsByRegion',
    );

    const guideRevenue = toNumber(bookingsRevenueAgg._sum.totalAmount);
    const eventRevenue = toNumber(eventRevenueAgg._sum.totalAmount);
    const marketplaceRevenue = toNumber(marketplaceRevenueAgg._sum.totalAmount);

    const topSiteRegions = sitesByRegion
      .map((entry) => ({ region: entry.region, count: entry._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topEventRegions = eventsByRegion
      .map((entry) => ({ region: entry.region, count: entry._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const analyticsEventClient = prisma as unknown as {
      analyticsEvent: {
        count: (args: {
          where: {
            createdAt?: { gte: Date };
            eventType?: string | { in: string[] };
          };
        }) => Promise<number>;
        groupBy: (args: {
          by: ['module'];
          where: {
            createdAt: { gte: Date };
            eventType: { in: string[] };
          };
          _count: { _all: true };
        }) => Promise<Array<{ module: string; _count: { _all: number } }>>;
      };
    };

    const analyticsTableExists = await safeQuery(
      async () => {
        const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
          SELECT to_regclass('public."AnalyticsEvent"') IS NOT NULL AS "exists"
        `;
        return Boolean(rows[0]?.exists);
      },
      false,
      'analyticsTableExists',
    );

    let createdOrders30d = 0;
    let confirmedPayments30d = 0;
    let receiptViews30d = 0;
    let emergencyCreated30d = 0;
    let emergencyResolved30d = 0;
    let topDataModules: Array<{ module: string; _count: { _all: number } }> =
      [];

    if (analyticsTableExists) {
      createdOrders30d = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.count({
            where: {
              createdAt: { gte: windowStart },
              eventType: {
                in: [
                  'reservation_created',
                  'event_order_created',
                  'marketplace_order_created',
                  'restaurant_order_created',
                ],
              },
            },
          }),
        0,
        'createdOrders30d',
      );

      confirmedPayments30d = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.count({
            where: {
              createdAt: { gte: windowStart },
              eventType: {
                in: [
                  'payment_confirmed',
                  'event_payment_confirmed',
                  'marketplace_payment_confirmed',
                  'restaurant_payment_confirmed',
                ],
              },
            },
          }),
        0,
        'confirmedPayments30d',
      );

      receiptViews30d = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.count({
            where: {
              createdAt: { gte: windowStart },
              eventType: 'receipt_viewed',
            },
          }),
        0,
        'receiptViews30d',
      );

      emergencyCreated30d = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.count({
            where: {
              createdAt: { gte: windowStart },
              eventType: 'emergency_created',
            },
          }),
        0,
        'emergencyCreated30d',
      );

      emergencyResolved30d = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.count({
            where: {
              createdAt: { gte: windowStart },
              eventType: 'emergency_resolved',
            },
          }),
        0,
        'emergencyResolved30d',
      );

      topDataModules = await safeQuery(
        () =>
          analyticsEventClient.analyticsEvent.groupBy({
            by: ['module'],
            where: {
              createdAt: { gte: windowStart },
              eventType: {
                in: [
                  'reservation_created',
                  'event_order_created',
                  'marketplace_order_created',
                  'restaurant_order_created',
                ],
              },
            },
            _count: { _all: true },
          }),
        [] as Array<{ module: string; _count: { _all: number } }>,
        'topDataModules',
      );
    }

    const resolvedAlerts = await safeQuery(
      () =>
        prisma.emergencyAlert.findMany({
          where: {
            status: 'RESOLVED',
            createdAt: { gte: windowStart },
          },
          select: { createdAt: true, updatedAt: true },
        }),
      [] as Array<{ createdAt: Date; updatedAt: Date }>,
      'resolvedAlerts',
    );

    const paymentConversionRate =
      createdOrders30d > 0 ? confirmedPayments30d / createdOrders30d : 0;
    const receiptViewRate =
      confirmedPayments30d > 0 ? receiptViews30d / confirmedPayments30d : 0;

    const emergencyResolutionRate =
      emergencyCreated30d > 0 ? emergencyResolved30d / emergencyCreated30d : 0;

    const averageResolutionMinutes =
      resolvedAlerts.length > 0
        ? resolvedAlerts.reduce((sum, alert) => {
            const diffMs =
              alert.updatedAt.getTime() - alert.createdAt.getTime();
            return sum + Math.max(0, diffMs / (60 * 1000));
          }, 0) / resolvedAlerts.length
        : 0;

    const topModules = topDataModules
      .map((entry) => ({ module: entry.module, count: entry._count._all }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recommendedActions: Array<{
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      title: string;
      reason: string;
    }> = [];

    if (paymentConversionRate < 0.7) {
      recommendedActions.push({
        priority: 'HIGH',
        title: 'Optimiser le tunnel de paiement',
        reason: `Le taux de conversion paiement est inférieur à 70% sur les ${windowDays} derniers jours.`,
      });
    }

    if (confirmedPayments30d > 0 && receiptViewRate < 0.8) {
      recommendedActions.push({
        priority: 'MEDIUM',
        title: 'Augmenter la consultation des reçus',
        reason:
          'Moins de 80% des paiements confirmés aboutissent à une consultation de reçu.',
      });
    }

    if (emergencyCreated30d > 0 && emergencyResolutionRate < 0.8) {
      recommendedActions.push({
        priority: 'HIGH',
        title: 'Renforcer la cellule urgence',
        reason: `Le taux de résolution des urgences est inférieur à 80% sur les ${windowDays} derniers jours.`,
      });
    }

    if (averageResolutionMinutes > 45) {
      recommendedActions.push({
        priority: 'MEDIUM',
        title: 'Réduire le délai moyen de traitement urgence',
        reason: 'Le délai moyen de résolution dépasse 45 minutes.',
      });
    }

    if (topModules[0]) {
      recommendedActions.push({
        priority: 'LOW',
        title: `Accélérer les offres sur ${topModules[0].module}`,
        reason: `Le module ${topModules[0].module} est actuellement le plus actif en commandes/réservations.`,
      });
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        totalSites,
        totalEvents,
        totalBookings,
        totalProducts,
        unverifiedActors,
      },
      actorsByRole: {
        tourists,
        guides,
        artisans,
        organizers,
        admins,
      },
      activity30d: {
        bookings: bookings30d,
        eventOrders: eventOrders30d,
        marketplaceOrders: marketplaceOrders30d,
        restaurantOrders: restaurantOrders30d,
      },
      revenue: {
        guideRevenue,
        eventRevenue,
        marketplaceRevenue,
        total: guideRevenue + eventRevenue + marketplaceRevenue,
      },
      topRegions: {
        tourismSites: topSiteRegions,
        events: topEventRegions,
      },
      dataDriven: {
        windowDays,
        conversion30d: {
          createdOrders: createdOrders30d,
          confirmedPayments: confirmedPayments30d,
          receiptViews: receiptViews30d,
          paymentConversionRate,
          receiptViewRate,
        },
        emergency30d: {
          created: emergencyCreated30d,
          resolved: emergencyResolved30d,
          resolutionRate: emergencyResolutionRate,
          averageResolutionMinutes,
        },
        topModules,
        recommendedActions,
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      return NextResponse.json(
        { error: 'tables analytics non initialisées' },
        {
          status: 503,
        },
      );
    }

    console.error('GET /api/admin/national-analytics', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
