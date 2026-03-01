'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';

type OrganizerItemType = 'ACTIVITY' | 'EVENT';

type EventItem = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  description: string;
  lieu: string;
  region: string;
  startAt: string;
  endAt: string;
  capacity: number;
  status: string;
  ticketTypes?: Array<{
    id: string;
    nom: string;
    prix: string;
    quantityTotal: number;
  }>;
};

type OrganizerMeta = {
  itemType: OrganizerItemType;
  category: string;
  intensity?: number;
  durationHours?: number;
  level?: string;
  ticketPrice?: number;
  notes?: string;
};

type OrganisateurCrudClientProps = {
  userId: string;
};

function parseOrganizerMeta(description: string): OrganizerMeta {
  const fallback: OrganizerMeta = {
    itemType: 'EVENT',
    category: 'Outdoor',
    level: 'Intermédiaire',
    notes: description,
  };

  if (!description.startsWith('__ORG_META__')) {
    return fallback;
  }

  const firstLineBreak = description.indexOf('\n');
  const metaLine =
    firstLineBreak >= 0 ? description.slice(0, firstLineBreak) : description;
  const rawJson = metaLine.replace('__ORG_META__', '');
  const notes =
    firstLineBreak >= 0 ? description.slice(firstLineBreak + 1) : '';

  try {
    const parsed = JSON.parse(rawJson) as OrganizerMeta;
    return {
      ...fallback,
      ...parsed,
      notes: notes || parsed.notes || '',
    };
  } catch {
    return fallback;
  }
}

function buildOrganizerDescription(meta: OrganizerMeta) {
  const { notes, ...payload } = meta;
  return `__ORG_META__${JSON.stringify(payload)}\n${notes ?? ''}`;
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} FCFA`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function OrganisateurCrudClient({
  userId,
}: OrganisateurCrudClientProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<OrganizerItemType>('ACTIVITY');
  const [nom, setNom] = useState('Surf & Jet-ski à Assinie');
  const [category, setCategory] = useState('Nautique');
  const [description, setDescription] = useState('Activité nautique encadrée.');
  const [lieu, setLieu] = useState('Assinie');
  const [region, setRegion] = useState('Sud-Comoé');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [intensity, setIntensity] = useState(4);
  const [durationHours, setDurationHours] = useState(4);
  const [level, setLevel] = useState('Intermédiaire');
  const [ticketPrice, setTicketPrice] = useState(38000);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function applyTypeTemplate(type: OrganizerItemType) {
    if (type === 'ACTIVITY') {
      setNom('Surf & Jet-ski à Assinie');
      setCategory('Nautique');
      setDescription('Activité nautique encadrée.');
      setLieu('Assinie');
      setRegion('Sud-Comoé');
      setIntensity(4);
      setDurationHours(4);
      setTicketPrice(38000);
      return;
    }

    setNom('Trail Nature Taï Challenge');
    setCategory('Outdoor');
    setDescription('Trail nature avec encadrement professionnel.');
    setLieu('Taï');
    setRegion('Cavally');
    setLevel('Intermédiaire');
    setTicketPrice(12000);
  }

  function handleItemTypeChange(nextType: OrganizerItemType) {
    setItemType(nextType);

    if (!editingId) {
      applyTypeTemplate(nextType);
    }
  }

  function resetForm() {
    setEditingId(null);
    setItemType('ACTIVITY');
    setNom('Surf & Jet-ski à Assinie');
    setCategory('Nautique');
    setDescription('Activité nautique encadrée.');
    setLieu('Assinie');
    setRegion('Sud-Comoé');
    setStartAt('');
    setEndAt('');
    setCapacity(100);
    setIntensity(4);
    setDurationHours(4);
    setLevel('Intermédiaire');
    setTicketPrice(38000);
    setPhotoUrl('');
    setPhotoName('');
  }

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image.');
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('image_read_failed'));
      reader.readAsDataURL(file);
    });

    setPhotoUrl(base64);
    setPhotoName(file.name);
  }

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const defaultTicketPrice = itemType === 'ACTIVITY' ? 38000 : 12000;
    const effectiveTicketPrice =
      ticketPrice > 0 ? ticketPrice : defaultTicketPrice;

    const meta: OrganizerMeta = {
      itemType,
      category,
      intensity: itemType === 'ACTIVITY' ? intensity : undefined,
      durationHours: itemType === 'ACTIVITY' ? durationHours : undefined,
      level: itemType === 'EVENT' ? level : undefined,
      ticketPrice: effectiveTicketPrice,
      notes: description,
    };

    const endpoint = editingId ? `/api/events/${editingId}` : '/api/events';
    const method = editingId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingId ? {} : { organisateurId: userId }),
        nom,
        ...(photoUrl ? { photoUrl } : {}),
        description: buildOrganizerDescription(meta),
        lieu,
        region,
        startAt,
        endAt,
        capacity,
        ticketPrice: effectiveTicketPrice,
        status: 'PUBLISHED',
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Enregistrement impossible');
      return;
    }

    setMessage(editingId ? 'Entrée modifiée' : 'Entrée créée');
    resetForm();
    await loadEvents();
  }

  function startEdit(item: EventItem) {
    const meta = parseOrganizerMeta(item.description);
    const fallbackTicketPrice = meta.itemType === 'ACTIVITY' ? 38000 : 12000;

    setEditingId(item.id);
    setItemType(meta.itemType);
    setNom(item.nom);
    setCategory(meta.category);
    setDescription(meta.notes ?? '');
    setLieu(item.lieu);
    setRegion(item.region);
    setStartAt(item.startAt.slice(0, 16));
    setEndAt(item.endAt.slice(0, 16));
    setCapacity(item.capacity);
    setIntensity(meta.intensity ?? 4);
    setDurationHours(meta.durationHours ?? 4);
    setLevel(meta.level ?? 'Intermédiaire');
    setTicketPrice(
      meta.ticketPrice ??
        Number(item.ticketTypes?.[0]?.prix ?? fallbackTicketPrice),
    );
    setPhotoUrl(item.photoUrl ?? '');
    setPhotoName('');
    setError('');
    setMessage('');
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
      <h2 className="text-lg font-semibold">
        CRUD Organisateur — Activités & Événements
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-4">
        <select
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          value={itemType}
          onChange={(event) =>
            handleItemTypeChange(event.target.value as OrganizerItemType)
          }
        >
          <option value="ACTIVITY">Activité</option>
          <option value="EVENT">Événement</option>
        </select>
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
          placeholder="Catégorie (ex: Nautique, Outdoor)"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
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
        {itemType === 'ACTIVITY' ? (
          <>
            <input
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="number"
              min={1}
              max={5}
              placeholder="Intensité (1-5)"
              value={intensity}
              onChange={(event) =>
                setIntensity(Number(event.target.value) || 1)
              }
              required
            />
            <input
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="number"
              min={1}
              placeholder="Durée (heures)"
              value={durationHours}
              onChange={(event) =>
                setDurationHours(Number(event.target.value) || 1)
              }
              required
            />
            <input
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="number"
              min={1000}
              placeholder="Prix activité (FCFA)"
              value={ticketPrice}
              onChange={(event) =>
                setTicketPrice(Number(event.target.value) || 1000)
              }
              required
            />
          </>
        ) : (
          <>
            <select
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            >
              <option value="Débutant">Débutant</option>
              <option value="Intermédiaire">Intermédiaire</option>
              <option value="Avancé">Avancé</option>
            </select>
            <input
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="number"
              min={1000}
              placeholder="Prix ticket (FCFA)"
              value={ticketPrice}
              onChange={(event) =>
                setTicketPrice(Number(event.target.value) || 1000)
              }
              required
            />
          </>
        )}
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
        <div className="space-y-1 md:col-span-2">
          <input
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="file"
            accept="image/*"
            onChange={(event) => void handlePhotoChange(event)}
          />
          {photoName ? (
            <p className="text-xs text-zinc-500">{photoName}</p>
          ) : null}
        </div>
        {photoUrl ? (
          <div className="relative h-36 w-full overflow-hidden rounded-lg md:col-span-2">
            <Image
              src={photoUrl}
              alt="Prévisualisation activité"
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="flex gap-2 md:col-span-4">
          <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
            {editingId ? 'Enregistrer' : 'Créer l’activité / l’événement'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/15"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {events.map((eventItem) =>
          (() => {
            const meta = parseOrganizerMeta(eventItem.description);
            const eventTicket = Number(
              eventItem.ticketTypes?.[0]?.prix ?? meta.ticketPrice ?? 0,
            );

            return (
              <article
                key={eventItem.id}
                className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
              >
                {eventItem.photoUrl ? (
                  <div className="relative mb-2 h-36 w-full overflow-hidden rounded-lg">
                    <Image
                      src={eventItem.photoUrl}
                      alt={eventItem.nom}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <p className="font-medium">{eventItem.nom}</p>
                <p>
                  📍 {eventItem.lieu} • {meta.category}
                </p>

                {meta.itemType === 'ACTIVITY' ? (
                  <>
                    <p>
                      Intensité {meta.intensity ?? 4}/5 • Durée{' '}
                      {meta.durationHours ?? 4}h
                    </p>
                    <p>{formatMoney(meta.ticketPrice ?? 38000)}</p>
                  </>
                ) : (
                  <>
                    <p>
                      Date: {formatDate(eventItem.startAt)} • Niveau:{' '}
                      {meta.level ?? 'Intermédiaire'}
                    </p>
                    <p>Ticket {formatMoney(eventTicket || 12000)}</p>
                  </>
                )}

                <p>Statut: {eventItem.status}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => startEdit(eventItem)}
                    className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                  >
                    Modifier
                  </button>
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
            );
          })(),
        )}
      </div>
    </section>
  );
}
