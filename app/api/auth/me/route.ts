import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        nom: true,
        email: true,
        phone: true,
        role: true,
        verified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'utilisateur introuvable' },
        { status: 404 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET /api/auth/me', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
