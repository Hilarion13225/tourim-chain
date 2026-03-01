import { NextRequest, NextResponse } from 'next/server';
import { CertificationStatus } from '@/app/generated/prisma/enums';
import { verifyAccessToken } from '@/lib/auth';
import { registerBlockchainProof } from '@/lib/blockchain';
import { prisma } from '@/lib/prisma';

function hasOnChainConfig() {
  return Boolean(
    process.env.BLOCKCHAIN_RPC_URL && process.env.BLOCKCHAIN_PRIVATE_KEY,
  );
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

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'accès interdit' }, { status: 403 });
    }

    const body = (await request.json()) as {
      certificationId?: string;
      allOffchain?: boolean;
    };
    const certificationId = body.certificationId?.trim() ?? '';
    const processAllOffchain = body.allOffchain === true;

    if (!processAllOffchain && !certificationId) {
      return NextResponse.json(
        { error: 'certificationId requis (ou allOffchain=true)' },
        { status: 400 },
      );
    }

    if (!hasOnChainConfig()) {
      return NextResponse.json(
        {
          error:
            'configuration blockchain EVM manquante (BLOCKCHAIN_RPC_URL / BLOCKCHAIN_PRIVATE_KEY)',
        },
        { status: 400 },
      );
    }

    const certifications = processAllOffchain
      ? await prisma.certification.findMany({
          where: {
            status: CertificationStatus.APPROVED,
            blockchainHash: {
              startsWith: 'offchain_',
            },
          },
          select: {
            id: true,
            type: true,
            status: true,
            guideId: true,
            artisanId: true,
            issuedAt: true,
            blockchainHash: true,
          },
          orderBy: { updatedAt: 'desc' },
        })
      : await prisma.certification
          .findUnique({
            where: { id: certificationId },
            select: {
              id: true,
              type: true,
              status: true,
              guideId: true,
              artisanId: true,
              issuedAt: true,
              blockchainHash: true,
            },
          })
          .then((item) => (item ? [item] : []));

    if (certifications.length === 0) {
      return NextResponse.json(
        processAllOffchain
          ? { processed: 0, succeeded: 0, failed: 0, results: [] }
          : { error: 'certification introuvable' },
        { status: processAllOffchain ? 200 : 404 },
      );
    }

    const results: Array<{
      certificationId: string;
      success: boolean;
      txHash?: string;
      network?: string;
      mintedAt?: Date;
      explorerUrl?: string | null;
      error?: string;
    }> = [];

    for (const certification of certifications) {
      if (certification.status !== CertificationStatus.APPROVED) {
        results.push({
          certificationId: certification.id,
          success: false,
          error: 'la certification doit être APPROVED',
        });
        continue;
      }

      const ownerId = certification.guideId ?? certification.artisanId;

      if (!ownerId) {
        results.push({
          certificationId: certification.id,
          success: false,
          error: 'propriétaire de certification introuvable',
        });
        continue;
      }

      try {
        const proof = await registerBlockchainProof({
          ownerId,
          entityType: 'CERTIFICATION',
          sourceType: 'CERTIFICATION',
          sourceId: certification.id,
          forceNewAnchor: true,
          payload: {
            certificationId: certification.id,
            certificationType: certification.type,
            certificationStatus: certification.status,
            issuedAt: certification.issuedAt?.toISOString() ?? null,
          },
        });

        await prisma.certification.update({
          where: { id: certification.id },
          data: {
            blockchainHash: proof.asset.hashTransaction,
          },
        });

        results.push({
          certificationId: certification.id,
          success: true,
          txHash: proof.asset.hashTransaction,
          network: proof.asset.wallet === 'OFFCHAIN' ? 'OFFCHAIN' : 'EVM',
          mintedAt: proof.asset.mintedAt,
          explorerUrl: proof.explorerUrl,
        });
      } catch (error) {
        console.error('reanchor-certification:item', error);
        results.push({
          certificationId: certification.id,
          success: false,
          error: 'échec ancrage',
        });
      }
    }

    const succeeded = results.filter((item) => item.success).length;
    const failed = results.length - succeeded;

    if (!processAllOffchain) {
      const single = results[0];
      if (!single.success) {
        return NextResponse.json(
          { error: single.error ?? 'échec re-ancrage certification' },
          { status: 400 },
        );
      }

      return NextResponse.json({
        certificationId: single.certificationId,
        txHash: single.txHash,
        network: single.network,
        mintedAt: single.mintedAt,
        explorerUrl: single.explorerUrl,
      });
    }

    return NextResponse.json({
      processed: results.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    console.error('POST /api/admin/blockchain-reanchor-certification', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
