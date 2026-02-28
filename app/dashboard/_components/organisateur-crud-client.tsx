'use client';

import { FormEvent, useEffect, useState } from 'react';

type EventItem = {
  id: string;
  nom: string;
  lieu: string;
  region: string;
  startAt: string;
  status: string;
};

type OrganisateurCrudClientProps = {
  userId: string;
};

export default function OrganisateurCrudClient({
  userId,
}: OrganisateurCrudClientProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('Événement culturel');
  const [lieu, setLieu] = useState('Abidjan');
  const [region, setRegion] = useState('Lagunes');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadEvents() {
    const response = await fetch(
      `/api/events?organisateurId=${userId}&status=ALL`,
    );
    const data = (await response.json()) as EventItem[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement événements',
      );
      return;
    }

    setEvents(data as EventItem[]);
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/events?organisateurId=${userId}&status=ALL`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as
          | EventItem[]
          | { error?: string };

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ??
              'Erreur chargement événements',
          );
          return;
        }

        setEvents(data as EventItem[]);
      })
      .catch((error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          (error as { name: string }).name === 'AbortError'
        ) {
          return;
        }

        setError('Erreur chargement événements');
      });

    return () => {
      controller.abort();
    };
  }, [userId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organisateurId: userId,
        nom,
        description,
        lieu,
        region,
        startAt,
        endAt,
        capacity,
        status: 'PUBLISHED',
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création événement impossible');
      return;
    }

    setMessage('Événement créé');
    setNom('');
    setStartAt('');
    setEndAt('');
    await loadEvents();
  }

  async function archiveEvent(item: EventItem) {
    const response = await fetch(`/api/events/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Archivage impossible');
      return;
    }

    setMessage('Événement annulé');
    await loadEvents();
  }

  async function handleDelete(id: string) {
    const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression événement impossible');
      return;
    }

    setMessage('Événement supprimé');
    await loadEvents();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">CRUD Organisateur — Événements</h2>

      <form onSubmit={handleCreate} className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Nom"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Lieu"
          value={lieu}
          onChange={(event) => setLieu(event.target.value)}
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
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Région"
          value={region}
          onChange={(event) => setRegion(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={1}
          value={capacity}
          onChange={(event) => setCapacity(Number(event.target.value) || 1)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background md:col-span-4">
          Créer
        </button>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {events.map((eventItem) => (
          <article
            key={eventItem.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            <p className="font-medium">{eventItem.nom}</p>
            <p>
              {eventItem.lieu}, {eventItem.region}
            </p>
            <p>{new Date(eventItem.startAt).toLocaleString('fr-FR')}</p>
            <p>Statut: {eventItem.status}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void archiveEvent(eventItem)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Archiver
              </button>
              <button
                onClick={() => void handleDelete(eventItem.id)}
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
