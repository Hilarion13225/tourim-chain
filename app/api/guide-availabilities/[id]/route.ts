import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const availability = await prisma.guideAvailability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        { error: 'disponibilité introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json(availability);
  } catch (error) {
    console.error('GET /api/guide-availabilities/[id]', error);
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
    const { date, startAt, endAt, isAvailable } = body as {
      date?: string;
      startAt?: string;
      endAt?: string;
      isAvailable?: boolean;
    };

    const availability = await prisma.guideAvailability.update({
      where: { id },
      data: {
        ...(date ? { date: new Date(date) } : {}),
        ...(startAt ? { startAt: new Date(startAt) } : {}),
        ...(endAt ? { endAt: new Date(endAt) } : {}),
        ...(isAvailable !== undefined ? { isAvailable } : {}),
      },
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error('PATCH /api/guide-availabilities/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.guideAvailability.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/guide-availabilities/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
