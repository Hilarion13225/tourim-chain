import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/analytics';
import { verifyAccessToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const auth = token ? verifyAccessToken(token) : null;

    const body = (await request.json()) as {
      module?: string;
      receiptId?: string;
      entityId?: string;
      receiptType?: string;
    };

    const moduleName = body.module?.trim();
    const receiptId = body.receiptId?.trim();

    if (!moduleName || !receiptId) {
      return NextResponse.json(
        { error: 'module et receiptId sont requis' },
        { status: 400 },
      );
    }

    await trackEvent({
      userId: auth?.userId ?? null,
      eventType: 'receipt_viewed',
      module: moduleName,
      success: true,
      metadata: {
        receiptId,
        entityId: body.entityId ?? null,
        receiptType: body.receiptType ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/analytics/receipt-view', error);
    return NextResponse.json({ error: 'erreur serveur' }, { status: 500 });
  }
}
