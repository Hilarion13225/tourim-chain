import { NextRequest, NextResponse } from 'next/server';
import {
  CertificationStatus,
  CertificationType,
  UserRole,
  UserStatus,
} from '@/app/generated/prisma/enums';
import { registerBlockchainProof } from '@/lib/blockchain';
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

async function ensureApprovedCertificationForUser(params: {
  userId: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  userName: string;
}) {
  const { userId, role, userName } = params;

  let certificationType: (typeof CertificationType)[keyof typeof CertificationType] | null = null;
  let relationFilter: { guideId?: string; artisanId?: string } = {};

  if (role === UserRole.GUIDE) {
    certificationType = CertificationType.GUIDE_CERTIFICATION;
    relationFilter = { guideId: userId };
  }

  if (role === UserRole.ARTISAN) {
    certificationType = CertificationType.ARTISAN_AUTHENTICITY;
    relationFilter = { artisanId: userId };
  }

  if (!certificationType) {
    return;
  }

  const existingCertification = await prisma.certification.findFirst({
    where: {
      type: certificationType,
      ...relationFilter,
    },
    orderBy: { createdAt: 'desc' },
  });

  const approvedCertification = existingCertification
    ? await prisma.certification.update({
        where: { id: existingCertification.id },
        data: {
          status: CertificationStatus.APPROVED,
          issuedAt: existingCertification.issuedAt ?? new Date(),
        },
      })
    : await prisma.certification.create({
        data: {
          type: certificationType,
          status: CertificationStatus.APPROVED,
          issuedAt: new Date(),
          note: 'Certification approuvée via validation admin',
          ...(role === UserRole.GUIDE ? { guideId: userId } : {}),
          ...(role === UserRole.ARTISAN ? { artisanId: userId } : {}),
        },
      });

  if (role === UserRole.GUIDE) {
    await prisma.guideProfile.updateMany({
      where: { userId },
      data: { isCertified: true },
    });
  }

  if (role === UserRole.ARTISAN) {
    await prisma.artisanProfile.updateMany({
      where: { userId },
      data: { isCertified: true },
    });
  }

  try {
    const blockchainProof = await registerBlockchainProof({
      ownerId: userId,
      entityType: 'CERTIFICATION',
      sourceType: 'CERTIFICATION',
      sourceId: approvedCertification.id,
      payload: {
        certificationId: approvedCertification.id,
        certificationType: approvedCertification.type,
        certificationStatus: approvedCertification.status,
        role,
        userId,
        userName,
      },
    });

    await prisma.certification.update({
      where: { id: approvedCertification.id },
      data: {
        blockchainHash: blockchainProof.asset.hashTransaction,
      },
    });
  } catch (blockchainError) {
    console.error('blockchain:certification', blockchainError);
  }
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
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        verified: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'utilisateur introuvable' },
        { status: 404 },
      );
    }

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
        ...(role ? { role: role as UserRole } : {}),
        ...(status ? { status: status as UserStatus } : {}),
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

    const shouldIssueCertification =
      verified === true &&
      (existingUser.verified === false ||
        existingUser.role !== (user.role as (typeof UserRole)[keyof typeof UserRole]));

    if (shouldIssueCertification) {
      await ensureApprovedCertificationForUser({
        userId: user.id,
        role: user.role,
        userName: user.nom,
      });
    }

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