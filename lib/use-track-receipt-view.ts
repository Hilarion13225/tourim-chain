'use client';

import { useEffect } from 'react';

type TrackReceiptViewInput = {
  module: string;
  receiptId: string;
  entityId?: string | null;
  receiptType?: string | null;
};

export function useTrackReceiptView(input: TrackReceiptViewInput) {
  const { module, receiptId, entityId, receiptType } = input;

  useEffect(() => {
    if (!module || !receiptId || receiptId === 'N/A') {
      return;
    }

    const dedupeKey = `receipt_viewed:${module}:${receiptId}`;

    if (
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(dedupeKey)
    ) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(dedupeKey, '1');
    }

    void fetch('/api/analytics/receipt-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module,
        receiptId,
        entityId,
        receiptType,
      }),
    }).catch(() => {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(dedupeKey);
      }
    });
  }, [entityId, module, receiptId, receiptType]);
}
