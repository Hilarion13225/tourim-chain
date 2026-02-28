'use client';

import { FormEvent, useEffect, useState } from 'react';

type Booking = {
  id: string;
  date: string;
  participants: number;
  statut: string;
};

type TouristeCrudClientProps = {
  userId: string;
};

export default function TouristeCrudClient({
  userId,
}: TouristeCrudClientProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [siteId, setSiteId] = useState('');
  const [participants, setParticipants] = useState(1);
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadBookings() {
    const response = await fetch(`/api/bookings?touristId=${userId}`);
    const data = (await response.json()) as Booking[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement bookings',
      );
      return;
    }

    setBookings(data as Booking[]);
  }

  useEffect(() => {
    void loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');

    const response = await fetch('/api/bookings/quick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId: siteId || undefined,
        participants,
        date: date || undefined,
      }),
    });

    const data = (await response.json()) as {
      error?: string;
      booking?: { id?: string };
    };

    if (!response.ok) {
      setError(data.error ?? 'Création réservation impossible');
      return;
    }

    setMessage(`Réservation créée (#${data.booking?.id ?? 'N/A'})`);
    setSiteId('');
    setParticipants(1);
    setDate('');
    await loadBookings();
  }

  async function handleStatus(id: string, statut: string) {
    setMessage('');
    setError('');

    const response = await fetch(`/api/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour impossible');
      return;
    }

    setMessage('Statut réservation mis à jour');
    await loadBookings();
  }

  async function handleDelete(id: string) {
    setMessage('');
    setError('');

    const response = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    setMessage('Réservation supprimée');
    await loadBookings();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">CRUD Touriste — Réservations</h2>

      <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Site ID (optionnel)"
          value={siteId}
          onChange={(event) => setSiteId(event.target.value)}
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={1}
          value={participants}
          onChange={(event) => setParticipants(Number(event.target.value) || 1)}
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="datetime-local"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
          Créer
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {bookings.map((booking) => (
          <article
            key={booking.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            <p className="font-medium">#{booking.id}</p>
            <p>Date: {new Date(booking.date).toLocaleString('fr-FR')}</p>
            <p>Participants: {booking.participants}</p>
            <p>Statut: {booking.statut}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => void handleStatus(booking.id, 'CONFIRMED')}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Confirmer
              </button>
              <button
                onClick={() => void handleStatus(booking.id, 'CANCELLED')}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Annuler
              </button>
              <button
                onClick={() => void handleDelete(booking.id)}
                className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
