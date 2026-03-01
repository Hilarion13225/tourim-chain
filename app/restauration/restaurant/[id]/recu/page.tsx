'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useTrackReceiptView } from '@/lib/use-track-receipt-view';

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

function paymentMethodLabelFromValue(method: string | null) {
  if (!method) {
    return 'Non précisé';
  }

  switch (method) {
    case 'MOBILE_MONEY':
      return 'Mobile Money';
    case 'CARD':
      return 'Carte bancaire';
    case 'BANK_TRANSFER':
      return 'Virement bancaire';
    case 'CASH_ON_SERVICE':
      return 'Paiement sur place';
    default:
      return method;
  }
}

function toIsoDateOrNow(value: string | null) {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function RestaurantRecuPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const restaurantId = params?.id;
  const bookingId = searchParams.get('bookingId') ?? 'N/A';
  const restaurantName = searchParams.get('restaurantName') ?? 'Restaurant';
  const fullName = searchParams.get('fullName') ?? 'Client';
  const serviceDate = searchParams.get('serviceDate') ?? '';
  const paymentMethod = searchParams.get('paymentMethod');
  const paymentMethodDisplay =
    searchParams.get('paymentMethodLabel') ??
    paymentMethodLabelFromValue(paymentMethod);
  const participants = Number(searchParams.get('participants') ?? '1');
  const unitAmount = Number(searchParams.get('unitAmount') ?? '0');
  const totalAmount = Number(searchParams.get('totalAmount') ?? '0');
  const issuedAt = toIsoDateOrNow(searchParams.get('issuedAt'));

  useTrackReceiptView({
    module: 'RESTAURATION',
    receiptId: bookingId,
    entityId: restaurantId ?? null,
    receiptType: 'RESTAURANT_RECEIPT',
  });

  const verificationPayload = useMemo(
    () =>
      JSON.stringify({
        type: 'RESTAURANT_RECEIPT',
        bookingId,
        restaurantId,
        restaurantName,
        fullName,
        paymentMethod: paymentMethod ?? 'UNKNOWN',
        participants,
        totalAmount,
        issuedAt: issuedAt.toISOString(),
      }),
    [
      bookingId,
      fullName,
      issuedAt,
      participants,
      paymentMethod,
      restaurantId,
      restaurantName,
      totalAmount,
    ],
  );

  const verificationQr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    verificationPayload,
  )}`;

  function handleExportTxt() {
    const lines = [
      'RECU RESTAURANT',
      `Reference: ${bookingId}`,
      `Restaurant: ${restaurantName}`,
      `Client: ${fullName}`,
      `Date reservation: ${serviceDate || '-'}`,
      `Paiement: ${paymentMethodDisplay}`,
      `Couverts: ${participants}`,
      `Prix moyen: ${formatXof(unitAmount)}`,
      `Total: ${formatXof(totalAmount)}`,
      `Date emission: ${issuedAt.toLocaleString('fr-FR')}`,
      '',
      `Verification: ${verificationPayload}`,
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `recu-restaurant-${bookingId}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-8 lg:px-10">
      <p className="text-xs text-zinc-500">
        <Link href="/restauration" className="hover:underline">
          Restauration
        </Link>{' '}
        {'>'} Reçu
      </p>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <p className="text-sm font-medium text-emerald-600">
              Paiement confirmé
            </p>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900">
              Reçu restaurant
            </h1>
            <p className="text-sm text-zinc-500">Référence #{bookingId}</p>
          </div>
          <p className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white">
            {issuedAt.toLocaleString('fr-FR')}
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_240px]">
          <article className="space-y-3 text-sm text-zinc-700">
            <p>
              Restaurant: <strong>{restaurantName}</strong>
            </p>
            <p>
              Client: <strong>{fullName}</strong>
            </p>
            <p>
              Date de réservation:{' '}
              <strong>{serviceDate || 'Non précisée'}</strong>
            </p>
            <p>
              Mode de paiement: <strong>{paymentMethodDisplay}</strong>
            </p>
            <p>
              Couverts: <strong>{participants}</strong>
            </p>
            <p>
              Ticket moyen: <strong>{formatXof(unitAmount)}</strong>
            </p>
            <p className="text-base font-extrabold text-zinc-900">
              Total payé: {formatXof(totalAmount)}
            </p>
          </article>

          <article className="space-y-2 rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-center">
            <Image
              src={verificationQr}
              alt="QR de vérification du reçu"
              width={220}
              height={220}
              className="mx-auto rounded-xl bg-white p-2"
              unoptimized
            />
            <p className="text-xs text-zinc-500">
              QR d’authenticité scannable pour vérification.
            </p>
          </article>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Exporter / Imprimer
          </button>
          <button
            onClick={handleExportTxt}
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Exporter en .txt
          </button>
          <Link
            href={`/restauration/restaurant/${restaurantId}`}
            className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700"
          >
            Retour au restaurant
          </Link>
        </div>
      </section>
    </main>
  );
}
