import { NextRequest, NextResponse } from 'next/server';
import { UserRole, UserStatus } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';

function isValidUserRole(
  value: string,
): value is (typeof UserRole)[keyof typeof UserRole] {
  return Object.values(UserRole).includes(
    value as (typeof UserRole)[keyof typeof UserRole],
  );
}

function isValidUserStatus(
  value: string,
): value is (typeof UserStatus)[keyof typeof UserStatus] {
  return Object.values(UserStatus).includes(
    value as (typeof UserStatus)[keyof typeof UserStatus],
  );
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
        touristProfile: true,
        guideProfile: true,
        artisanProfile: true,
        organizerProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'utilisateur introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/users/[id]', error);
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
    const { nom, role, status, verified } = body as {
      nom?: string;
      role?: string;
      status?: string;
      verified?: boolean;
    };

    if (role && !isValidUserRole(role)) {
      return NextResponse.json({ error: 'role invalide' }, { status: 400 });
    }

    if (status && !isValidUserStatus(status)) {
      return NextResponse.json({ error: 'status invalide' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(nom ? { nom } : {}),
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(verified !== undefined ? { verified } : {}),
      },
      select: {
        id: true,
        nom: true,
        email: true,
        role: true,
        status: true,
        verified: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('PATCH /api/users/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/users/[id]', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
