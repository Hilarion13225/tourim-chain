import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type StatsRow = {
  eventType: string;
  total: number;
  backfill: number;
  runtime: number;
};

type LatestRow = {
  latestAt: Date | null;
};

function toNumber(value: unknown) {
  if (typeof value === 'bigint') {
    return Number(value);
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

    const tableExistsRows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT to_regclass('public."AnalyticsEvent"') IS NOT NULL AS "exists"
    `;

    const analyticsTableExists = Boolean(tableExistsRows[0]?.exists);

    if (!analyticsTableExists) {
      return NextResponse.json({
        analyticsTableExists: false,
        summary: {
          totalEvents: 0,
          backfillEvents: 0,
          runtimeEvents: 0,
          latestEventAt: null,
        },
        byEventType: [],
      });
    }

    const rows = await prisma.$queryRaw<
      Array<{
        eventType: string;
        total: bigint | number;
        backfill: bigint | number;
        runtime: bigint | number;
      }>
    >`
      SELECT
        "eventType" AS "eventType",
        COUNT(*) AS "total",
        COUNT(*) FILTER (
          WHERE COALESCE(("metadata"->>'backfill')::boolean, false) = true
        ) AS "backfill",
        COUNT(*) FILTER (
          WHERE COALESCE(("metadata"->>'backfill')::boolean, false) = false
        ) AS "runtime"
      FROM "AnalyticsEvent"
      GROUP BY "eventType"
      ORDER BY COUNT(*) DESC, "eventType" ASC
    `;

    const latestRows = await prisma.$queryRaw<LatestRow[]>`
      SELECT MAX("createdAt") AS "latestAt"
      FROM "AnalyticsEvent"
    `;

    const byEventType: StatsRow[] = rows.map((row) => ({
      eventType: row.eventType,
      total: toNumber(row.total),
      backfill: toNumber(row.backfill),
      runtime: toNumber(row.runtime),
    }));

    const summary = byEventType.reduce(
      (acc, row) => {
        acc.totalEvents += row.total;
        acc.backfillEvents += row.backfill;
        acc.runtimeEvents += row.runtime;
        return acc;
      },
      { totalEvents: 0, backfillEvents: 0, runtimeEvents: 0 },
    );

    return NextResponse.json({
      analyticsTableExists: true,
      summary: {
        ...summary,
        latestEventAt: latestRows[0]?.latestAt ?? null,
      },
      byEventType,
    });
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      return NextResponse.json({
        analyticsTableExists: false,
        summary: {
          totalEvents: 0,
          backfillEvents: 0,
          runtimeEvents: 0,
          latestEventAt: null,
        },
        byEventType: [],
      });
    }

    console.error('GET /api/admin/analytics-backfill-stats', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
