import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function toNumberOrNull(value: unknown) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toSeverity(value: unknown) {
  if (
    value === 'LOW' ||
    value === 'MEDIUM' ||
    value === 'HIGH' ||
    value === 'CRITICAL'
  ) {
    return value;
  }

  return 'MEDIUM';
}

function toAlertStatus(value: unknown) {
  if (value === 'OPEN' || value === 'IN_PROGRESS' || value === 'RESOLVED') {
    return value;
  }

  return null;
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

    const alerts = await (
      prisma as unknown as {
        emergencyAlert: {
          findMany: (args: {
            orderBy: { createdAt: 'desc' };
            take: number;
            select: {
              id: true;
              issueType: true;
              description: true;
              severity: true;
              latitude: true;
              longitude: true;
              locationAccuracyM: true;
              contactPhone: true;
              status: true;
              createdAt: true;
              tourist: {
                select: {
                  id: true;
                  nom: true;
                  email: true;
                  phone: true;
                };
              };
            };
          }) => Promise<
            Array<{
              id: string;
              issueType: string;
              description: string;
              severity: string;
              latitude: number | null;
              longitude: number | null;
              locationAccuracyM: number | null;
              contactPhone: string | null;
              status: string;
              createdAt: Date;
              tourist: {
                id: string;
                nom: string;
                email: string;
                phone: string | null;
              };
            }>
          >;
        };
      }
    ).emergencyAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        issueType: true,
        description: true,
        severity: true,
        latitude: true,
        longitude: true,
        locationAccuracyM: true,
        contactPhone: true,
        status: true,
        createdAt: true,
        tourist: {
          select: {
            id: true,
            nom: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('GET /api/emergency-alerts', error);
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

    const body = (await request.json()) as {
      issueType?: string;
      description?: string;
      severity?: string;
      latitude?: number;
      longitude?: number;
      locationAccuracyM?: number;
      contactPhone?: string;
    };

    const issueType = body.issueType?.trim();
    const description = body.description?.trim();

    if (!issueType || !description) {
      return NextResponse.json(
        { error: 'issueType et description sont requis' },
        { status: 400 },
      );
    }

    const latitude = toNumberOrNull(body.latitude);
    const longitude = toNumberOrNull(body.longitude);
    const locationAccuracyM = toNumberOrNull(body.locationAccuracyM);
    const resolvedSeverity = toSeverity(body.severity);

    const alert = await (
      prisma as unknown as {
        emergencyAlert: {
          create: (args: {
            data: {
              touristId: string;
              issueType: string;
              description: string;
              severity: string;
              latitude: number | null;
              longitude: number | null;
              locationAccuracyM: number | null;
              contactPhone: string | null;
            };
            select: { id: true; status: true; createdAt: true };
          }) => Promise<{ id: string; status: string; createdAt: Date }>;
        };
      }
    ).emergencyAlert.create({
      data: {
        touristId: payload.userId,
        issueType,
        description,
        severity: resolvedSeverity,
        latitude,
        longitude,
        locationAccuracyM: locationAccuracyM
          ? Math.round(locationAccuracyM)
          : null,
        contactPhone: body.contactPhone?.trim() || null,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    await trackEvent({
      userId: payload.userId,
      eventType: 'emergency_created',
      module: 'URGENCE',
      success: true,
      metadata: {
        alertId: alert.id,
        issueType,
        severity: resolvedSeverity,
      },
    });

    return NextResponse.json({ success: true, alert }, { status: 201 });
  } catch (error) {
    console.error('POST /api/emergency-alerts', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const body = (await request.json()) as {
      alertId?: string;
      status?: string;
    };

    const alertId = body.alertId?.trim();
    const status = toAlertStatus(body.status);

    if (!alertId || !status) {
      return NextResponse.json(
        { error: 'alertId et status valides sont requis' },
        { status: 400 },
      );
    }

    const updated = await (
      prisma as unknown as {
        emergencyAlert: {
          update: (args: {
            where: { id: string };
            data: { status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' };
            select: { id: true; status: true; updatedAt: true };
          }) => Promise<{ id: string; status: string; updatedAt: Date }>;
        };
      }
    ).emergencyAlert.update({
      where: { id: alertId },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    await trackEvent({
      eventType:
        status === 'RESOLVED' ? 'emergency_resolved' : 'emergency_updated',
      module: 'URGENCE',
      success: true,
      metadata: {
        alertId,
        status,
      },
    });

    return NextResponse.json({ success: true, alert: updated });
  } catch (error) {
    console.error('PATCH /api/emergency-alerts', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
