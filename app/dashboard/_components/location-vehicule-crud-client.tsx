'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';

type VehicleItem = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  description?: string | null;
  ville: string;
  type: string;
  transmission: string;
  prixParJour: string;
  climatisation: boolean;
  disponible: boolean;
};

type LocationVehiculeCrudClientProps = {
  userId: string;
};

function toMoney(value: string) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return value;
  }

  return new Intl.NumberFormat('fr-FR').format(amount);
}

export default function LocationVehiculeCrudClient({
  userId,
}: LocationVehiculeCrudClientProps) {
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [nom, setNom] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [description, setDescription] = useState('');
  const [ville, setVille] = useState('Abidjan');
  const [type, setType] = useState('SUV');
  const [transmission, setTransmission] = useState('Automatique');
  const [prixParJour, setPrixParJour] = useState(25000);
  const [climatisation, setClimatisation] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function resetForm() {
    setNom('');
    setPhotoUrl('');
    setPhotoName('');
    setDescription('');
    setVille('Abidjan');
    setType('SUV');
    setTransmission('Automatique');
    setPrixParJour(25000);
    setClimatisation(true);
    setEditingId(null);
  }

  async function loadItems() {
    const response = await fetch('/api/vehicle-rentals');
    const data = (await response.json()) as VehicleItem[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement véhicules',
      );
      return;
    }

    setItems(data as VehicleItem[]);
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/vehicle-rentals', { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as
          | VehicleItem[]
          | { error?: string };

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ?? 'Erreur chargement véhicules',
          );
          return;
        }

        setItems(data as VehicleItem[]);
      })
      .catch((fetchError: unknown) => {
        if (
          fetchError &&
          typeof fetchError === 'object' &&
          'name' in fetchError &&
          (fetchError as { name: string }).name === 'AbortError'
        ) {
          return;
        }

        setError('Erreur chargement véhicules');
      });

    return () => {
      controller.abort();
    };
  }, [userId]);

  async function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoUrl('');
      setPhotoName('');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide.');
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('read_error'));
      reader.readAsDataURL(file);
    });

    setPhotoUrl(dataUrl);
    setPhotoName(file.name);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!editingId && !photoUrl) {
      setError('Veuillez sélectionner une photo pour le véhicule.');
      return;
    }

    const payload = {
      nom,
      ...(photoUrl ? { photoUrl } : {}),
      description,
      ville,
      type,
      transmission,
      prixParJour,
      climatisation,
    };

    const response = await fetch(
      editingId ? `/api/vehicle-rentals/${editingId}` : '/api/vehicle-rentals',
      {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(
        data.error ??
          (editingId ? 'Modification impossible' : 'Création impossible'),
      );
      return;
    }

    setMessage(editingId ? 'Véhicule modifié' : 'Véhicule ajouté');
    resetForm();
    await loadItems();
  }

  function startEdit(item: VehicleItem) {
    setError('');
    setMessage('');
    setEditingId(item.id);
    setNom(item.nom);
    setPhotoUrl(item.photoUrl ?? '');
    setPhotoName('');
    setDescription(item.description ?? '');
    setVille(item.ville);
    setType(item.type);
    setTransmission(item.transmission);
    setPrixParJour(Number(item.prixParJour) || 0);
    setClimatisation(item.climatisation);
  }

  async function toggleDisponible(item: VehicleItem) {
    setError('');
    setMessage('');

    const response = await fetch(`/api/vehicle-rentals/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disponible: !item.disponible }),
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
    setError('');
    setMessage('');

    const response = await fetch(`/api/vehicle-rentals/${id}`, {
      method: 'DELETE',
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    setMessage('Véhicule supprimé');
    await loadItems();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">
        CRUD Entreprise Location Véhicule
      </h2>

      <form onSubmit={handleSubmit} className="grid gap-2 md:grid-cols-4">
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Nom véhicule"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
        <label className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15">
          <span className="mb-1 block text-xs text-zinc-500">
            Photo véhicule
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              setError('');
              const file = event.target.files?.[0] ?? null;
              void handlePhotoChange(file);
            }}
            required={!editingId}
            className="w-full text-sm"
          />
          {photoName ? (
            <span className="mt-1 block text-xs">{photoName}</span>
          ) : null}
        </label>
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Ville"
          value={ville}
          onChange={(event) => setVille(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          placeholder="Transmission"
          value={transmission}
          onChange={(event) => setTransmission(event.target.value)}
          required
        />
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
          type="number"
          min={0}
          value={prixParJour}
          onChange={(event) => setPrixParJour(Number(event.target.value) || 0)}
          required
        />
        <label className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15">
          <input
            type="checkbox"
            checked={climatisation}
            onChange={(event) => setClimatisation(event.target.checked)}
          />
          Climatisation
        </label>
        <input
          className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-2"
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <div className="flex gap-2 md:col-span-4">
          <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
            {editingId ? 'Enregistrer la modification' : 'Créer'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            >
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      {photoUrl ? (
        <div className="relative h-40 w-full overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
          <Image
            src={photoUrl}
            alt="Aperçu véhicule"
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            {item.photoUrl ? (
              <div className="relative mb-2 h-36 w-full overflow-hidden rounded-lg">
                <Image
                  src={item.photoUrl}
                  alt={item.nom}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <p className="font-medium">{item.nom}</p>
            <p>
              {item.ville} • {item.type} • {item.transmission}
            </p>
            <p>
              {toMoney(item.prixParJour)} FCFA / jour •{' '}
              {item.climatisation ? 'Climatisation' : 'Sans climatisation'}
            </p>
            <p>Statut: {item.disponible ? 'Disponible' : 'Indisponible'}</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => void toggleDisponible(item)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                {item.disponible
                  ? 'Marquer indisponible'
                  : 'Marquer disponible'}
              </button>
              <button
                onClick={() => startEdit(item)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Modifier
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
