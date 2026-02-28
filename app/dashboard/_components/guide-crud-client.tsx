'use client';

import { FormEvent, useEffect, useState } from 'react';

type Availability = {
  id: string;
  date: string;
  startAt: string;
  endAt: string;
  isAvailable: boolean;
};

type GuideCrudClientProps = {
  userId: string;
};

export default function GuideCrudClient({ userId }: GuideCrudClientProps) {
  const [items, setItems] = useState<Availability[]>([]);
  const [date, setDate] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadItems() {
    const response = await fetch(
      `/api/guide-availabilities?guideUserId=${userId}`,
    );
    const data = (await response.json()) as Availability[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ??
          'Erreur chargement disponibilités',
      );
      return;
    }

    setItems(data as Availability[]);
  }

  useEffect(() => {
    void loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const response = await fetch('/api/guide-availabilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideUserId: userId, date, startAt, endAt }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création impossible');
      return;
    }

    setMessage('Disponibilité créée');
    setDate('');
    setStartAt('');
    setEndAt('');
    await loadItems();
  }

  async function toggleAvailability(item: Availability) {
    const response = await fetch(`/api/guide-availabilities/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour impossible');
      return;
    }

    setMessage('Disponibilité mise à jour');
    await loadItems();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/guide-availabilities/${id}`, {
      method: 'DELETE',
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    setMessage('Disponibilité supprimée');
    await loadItems();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">CRUD Guide — Disponibilités</h2>

      <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="datetime-local"
          value={startAt}
          onChange={(event) => setStartAt(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="datetime-local"
          value={endAt}
          onChange={(event) => setEndAt(event.target.value)}
          required
        />
        <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
          Créer
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            <p className="font-medium">#{item.id}</p>
            <p>Date: {new Date(item.date).toLocaleDateString('fr-FR')}</p>
            <p>Début: {new Date(item.startAt).toLocaleString('fr-FR')}</p>
            <p>Fin: {new Date(item.endAt).toLocaleString('fr-FR')}</p>
            <p>Disponible: {item.isAvailable ? 'Oui' : 'Non'}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void toggleAvailability(item)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Basculer
              </button>
              <button
                onClick={() => void handleDelete(item.id)}
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
