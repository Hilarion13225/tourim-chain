'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockEvents } from '@/lib/mock-tourism-data';

const USE_MOCK_DATA = true;

type EventTicketType = {
  id: string;
  nom: string;
  prix: string;
  quantityTotal: number;
  quantitySold: number;
};

type EventItem = {
  id: string;
  nom: string;
  lieu: string;
  region: string;
  startAt: string;
  ticketTypes: EventTicketType[];
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export default function EvenementsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);

  useEffect(() => {
    async function loadSession() {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          setSessionUserId(null);
          return;
        }

        const data = (await response.json()) as { user?: { id?: string } };
        setSessionUserId(data.user?.id ?? null);
      } catch {
        setSessionUserId(null);
      }
    }

    async function loadEvents() {
      setIsLoading(true);
      setError('');

      if (USE_MOCK_DATA) {
        setEvents(mockEvents);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/events');
        const data = (await response.json()) as
          | EventItem[]
          | { error?: string };

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ?? 'Erreur de chargement',
          );
          setEvents([]);
          return;
        }

        setEvents(data as EventItem[]);
      } catch {
        setError('Erreur réseau, veuillez réessayer.');
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
    void loadEvents();
  }, []);

  async function handleBuy(eventId: string) {
    setActionError('');
    setActionSuccess('');

    if (!sessionUserId) {
      router.push('/login');
      return;
    }

    setLoadingEventId(eventId);

    if (USE_MOCK_DATA) {
      setActionSuccess(
        `Billet acheté avec succès (mode démo) pour ${eventId}.`,
      );
      setLoadingEventId(null);
      return;
    }

    try {
      const response = await fetch('/api/events/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, quantity: 1 }),
      });

      const data = (await response.json()) as {
        error?: string;
        totalAmount?: number;
      };

      if (!response.ok) {
        setActionError(data.error ?? 'Achat impossible');
        return;
      }

      setActionSuccess(
        `Billet acheté avec succès (${new Intl.NumberFormat('fr-FR').format(data.totalAmount ?? 0)} FCFA).`,
      );
    } catch {
      setActionError('Erreur réseau pendant l’achat.');
    } finally {
      setLoadingEventId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Événements en Côte d’Ivoire</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Réservez vos billets culturels, festivals ivoiriens et expériences
          live avec contrôle QR.
        </p>
      </header>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? (
        <p className="text-sm text-red-600">{actionError}</p>
      ) : null}
      {actionSuccess ? (
        <p className="text-sm text-emerald-600">{actionSuccess}</p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Chargement des événements...</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-3">
          {events.map((eventItem) => {
            const totalTickets = eventItem.ticketTypes.reduce(
              (sum, ticketType) => sum + ticketType.quantityTotal,
              0,
            );
            const soldTickets = eventItem.ticketTypes.reduce(
              (sum, ticketType) => sum + ticketType.quantitySold,
              0,
            );

            return (
              <article
                key={eventItem.id}
                className="rounded-2xl border border-black/10 p-5 dark:border-white/15"
              >
                <div className="h-32 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <h2 className="mt-4 font-semibold">{eventItem.nom}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {eventItem.lieu}, {eventItem.region}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {formatDate(eventItem.startAt)}
                </p>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span>
                    {Math.max(totalTickets - soldTickets, 0)} billets restants
                  </span>
                  <button
                    onClick={() => void handleBuy(eventItem.id)}
                    className="rounded-full bg-foreground px-3 py-1.5 text-background disabled:opacity-60"
                    disabled={loadingEventId === eventItem.id}
                  >
                    {loadingEventId === eventItem.id ? 'Achat...' : 'Acheter'}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
