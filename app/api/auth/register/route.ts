import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/app/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import {
  getDashboardPathByRole,
  hashPassword,
  signAccessToken,
} from '@/lib/auth';

function isValidUserRole(
  value: string,
): value is (typeof UserRole)[keyof typeof UserRole] {
  return Object.values(UserRole).includes(
    value as (typeof UserRole)[keyof typeof UserRole],
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nom, email, password, phone, role } = body as {
      nom?: string;
      email?: string;
      password?: string;
      phone?: string;
      role?: string;
    };

    const normalizedRole = role?.trim().toUpperCase();

    if (!nom || !email || !password || !normalizedRole) {
      return NextResponse.json(
        { error: 'nom, email, password et role sont requis' },
        { status: 400 },
      );
    }

    if (!isValidUserRole(normalizedRole)) {
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

    const createdUser = await prisma.$transaction(async (trx) => {
      const user = await trx.user.create({
        data: {
          nom,
          email,
          passwordHash,
          phone,
          role: normalizedRole,
        },
      });

      if (normalizedRole === UserRole.TOURIST) {
        await trx.touristProfile.create({ data: { userId: user.id } });
      }

      if (normalizedRole === UserRole.GUIDE) {
        await trx.guideProfile.create({ data: { userId: user.id } });
      }

      if (normalizedRole === UserRole.ARTISAN) {
        await trx.artisanProfile.create({ data: { userId: user.id } });
      }

      if (normalizedRole === UserRole.ORGANIZER) {
        await trx.organizerProfile.create({ data: { userId: user.id } });
      }

      return user;
    });

    const token = signAccessToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
    });

    const dashboardPath = getDashboardPathByRole(createdUser.role);

    const response = NextResponse.json(
      {
        token,
        dashboardPath,
        user: {
          id: createdUser.id,
          nom: createdUser.nom,
          email: createdUser.email,
          role: createdUser.role,
        },
      },
      { status: 201 },
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('POST /api/auth/register', error);

    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'email déjà utilisé' },
        { status: 409 },
      );
    }

    if (
      error &&
      typeof error === 'object' &&
      'message' in error &&
      String((error as { message?: string }).message).includes(
        'Invalid value for argument `role`',
      )
    ) {
      return NextResponse.json(
        { error: 'rôle non reconnu par la base, relance prisma generate' },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
