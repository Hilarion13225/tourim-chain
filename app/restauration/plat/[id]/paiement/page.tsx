'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

type PaymentMethod =
  | 'MOBILE_MONEY'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'CASH_ON_SERVICE';

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case 'MOBILE_MONEY':
      return 'Mobile Money';
    case 'CARD':
      return 'Carte bancaire';
    case 'BANK_TRANSFER':
      return 'Virement bancaire';
    case 'CASH_ON_SERVICE':
      return 'Paiement sur place';
  }
}

export default function PlatPaiementPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const dishId = params?.id;
  const orderId = searchParams.get('orderId') ?? 'N/A';
  const dishName = searchParams.get('dishName') ?? 'Plat';
  const restaurantId = searchParams.get('restaurantId') ?? '';
  const restaurantName = searchParams.get('restaurantName') ?? 'Restaurant';
  const fullName = searchParams.get('fullName') ?? 'Client';
  const serviceDate = searchParams.get('serviceDate') ?? '';
  const paymentMethod =
    (searchParams.get('paymentMethod') as PaymentMethod | null) ??
    'MOBILE_MONEY';
  const paymentMethodDisplay =
    searchParams.get('paymentMethodLabel') ?? paymentMethodLabel(paymentMethod);
  const quantity = Number(searchParams.get('quantity') ?? '1');
  const unitAmount = Number(searchParams.get('unitAmount') ?? '0');
  const totalAmount = Number(searchParams.get('totalAmount') ?? '0');

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  const qrPayload = JSON.stringify({
    type: 'DISH_ORDER_PAYMENT',
    orderId,
    dishId,
    dishName,
    restaurantId,
    restaurantName,
    fullName,
    paymentMethod,
    quantity,
    totalAmount,
    serviceDate,
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    qrPayload,
  )}`;

  async function handleConfirmScan() {
    setConfirmError('');
    setConfirming(true);

    if (orderId && orderId !== 'N/A') {
      try {
        const response = await fetch(`/api/restaurant-orders/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentStatus: 'PAID',
            status: 'PAID',
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setConfirmError(data.error ?? 'Confirmation du paiement impossible.');
          setConfirming(false);
          return;
        }
      } catch {
        setConfirmError('Erreur réseau pendant la confirmation.');
        setConfirming(false);
        return;
      }
    }

    const receiptParams = new URLSearchParams({
      orderId,
      dishId: dishId ?? '',
      dishName,
      restaurantId,
      restaurantName,
      fullName,
      serviceDate,
      paymentMethod,
      paymentMethodLabel: paymentMethodDisplay,
      quantity: String(quantity),
      unitAmount: String(unitAmount),
      totalAmount: String(totalAmount),
      issuedAt: new Date().toISOString(),
    });

    router.push(
      `/restauration/plat/${dishId}/recu?${receiptParams.toString()}`,
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8 lg:px-10">
      <p className="text-xs text-zinc-500">
        <Link href="/restauration" className="hover:underline">
          Restauration
        </Link>{' '}
        {'>'} Paiement
      </p>

      <section className="space-y-4 rounded-3xl bg-sky-500 p-6 text-white">
        <div className="space-y-1">
          <p className="text-4xl font-extrabold">Paiement commande plat</p>
          <p className="text-sm text-sky-50">
            {paymentMethodDisplay} • Commande #{orderId}
          </p>
        </div>

        <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-lg">
          <Image
            src={qrCodeUrl}
            alt="QR code paiement"
            width={260}
            height={260}
            unoptimized
          />
        </div>

        <p className="text-center text-2xl font-bold">
          Scannez le QR code pour payer
        </p>

        <article className="rounded-2xl bg-white/15 p-4 text-sm">
          <p>
            Restaurant: <strong>{restaurantName}</strong>
          </p>
          <p>
            Plat: <strong>{dishName}</strong>
          </p>
          <p>
            Quantité: <strong>{quantity}</strong>
          </p>
          <p>
            Montant: <strong>{formatXof(totalAmount)}</strong>
          </p>
        </article>

        {confirmError ? (
          <p className="text-sm text-red-100">{confirmError}</p>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={handleConfirmScan}
            disabled={confirming}
            className="flex-1 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-sky-700"
          >
            {confirming ? 'Confirmation...' : 'Confirmer, j’ai scanné'}
          </button>
          <button
            onClick={() => router.push(`/restauration/plat/${dishId}`)}
            className="rounded-xl border border-white/50 px-4 py-3 text-sm font-semibold"
          >
            Retour
          </button>
        </div>
      </section>
    </main>
  );
}
