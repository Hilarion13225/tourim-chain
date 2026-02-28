'use client';

import { useEffect, useMemo, useState } from 'react';

type Role =
  | 'TOURIST'
  | 'GUIDE'
  | 'ARTISAN'
  | 'ORGANIZER'
  | 'ACCOMMODATION_COMPANY'
  | 'VEHICLE_RENTAL_COMPANY'
  | 'ADMIN';

type DashboardSummaryClientProps = {
  role: Role;
  userId: string;
};

type SummaryData = Record<string, number>;

function formatNumber(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

export default function DashboardSummaryClient({
  role,
  userId,
}: DashboardSummaryClientProps) {
  const [data, setData] = useState<SummaryData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSummary() {
      setIsLoading(true);
      setError('');

      try {
        const params = new URLSearchParams({ role, userId });
        const response = await fetch(
          `/api/dashboard/summary?${params.toString()}`,
        );
        const payload = (await response.json()) as
          | SummaryData
          | { error?: string };

        if (!response.ok) {
          setError(
            (payload as { error?: string }).error ?? 'Erreur de chargement',
          );
          setData({});
          return;
        }

        setData(payload as SummaryData);
      } catch {
        setError('Erreur réseau, veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadSummary();
  }, [role, userId]);

  const cards = useMemo(() => {
    if (role === 'TOURIST') {
      return [
        { label: 'Voyages', value: data.voyages ?? 0 },
        { label: 'Billets NFT', value: data.billetsNft ?? 0 },
        { label: 'Favoris', value: data.favoris ?? 0 },
      ];
    }

    if (role === 'GUIDE') {
      return [
        { label: 'Calendrier', value: data.creneaux ?? 0 },
        { label: 'Réservations', value: data.reservations ?? 0 },
        { label: 'Revenus (FCFA)', value: data.revenus ?? 0 },
      ];
    }

    if (role === 'ARTISAN') {
      return [
        { label: 'Produits', value: data.produits ?? 0 },
        { label: 'Commandes', value: data.commandes ?? 0 },
        { label: 'Certificats', value: data.certificats ?? 0 },
      ];
    }

    if (role === 'ORGANIZER') {
      return [
        { label: 'Gestion événements', value: data.evenements ?? 0 },
        { label: 'Scan billets', value: data.scans ?? 0 },
      ];
    }

    if (role === 'ACCOMMODATION_COMPANY') {
      return [
        { label: 'Hébergements', value: data.hebergements ?? 0 },
        { label: 'Actifs', value: data.hebergementsActifs ?? 0 },
      ];
    }

    if (role === 'VEHICLE_RENTAL_COMPANY') {
      return [
        { label: 'Véhicules', value: data.vehicules ?? 0 },
        { label: 'Disponibles', value: data.vehiculesDisponibles ?? 0 },
      ];
    }

    return [
      { label: 'Validation acteurs', value: data.validationActeurs ?? 0 },
      { label: 'Analytics nationaux', value: data.analyticsNationaux ?? 0 },
    ];
  }, [data, role]);

  if (isLoading) {
    return (
      <p className="text-sm text-zinc-500">Chargement des indicateurs...</p>
    );
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <section
      className={`grid gap-4 ${cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}
    >
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-2xl border border-black/10 p-5 dark:border-white/15"
        >
          <p className="text-sm text-zinc-500">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatNumber(card.value)}
          </p>
        </article>
      ))}
    </section>
  );
}
