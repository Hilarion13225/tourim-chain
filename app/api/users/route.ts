import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

function isValidUserRole(
  value: string,
): value is (typeof UserRole)[keyof typeof UserRole] {
  return Object.values(UserRole).includes(
    value as (typeof UserRole)[keyof typeof UserRole],
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') ?? undefined;

    if (role && !isValidUserRole(role)) {
      return NextResponse.json({ error: 'role invalide' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role } : {}),
      },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET /api/users', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, password, role, guideRegion } = body as {
      nom?: string;
      email?: string;
      password?: string;
      role?: string;
      guideRegion?: string;
    };

    if (!nom || !email || !password || !role) {
      return NextResponse.json(
        { error: 'nom, email, password et role sont requis' },
        { status: 400 },
      );
    }

    if (!isValidUserRole(role)) {
      return NextResponse.json({ error: 'role invalide' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'email déjà utilisé' },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        nom,
        email,
        passwordHash,
        role,
        ...(role === UserRole.GUIDE
          ? {
              guideProfile: {
                create: {
                  region: guideRegion?.trim() || null,
                },
              },
            }
          : {}),
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

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('POST /api/users', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
