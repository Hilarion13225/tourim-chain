'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type ServiceType = 'HEBERGEMENT' | 'VEHICULE';

type Accommodation = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  ville: string;
  type: 'Hotel' | 'Appartement' | 'Villa';
  prixNuit: number;
  note: number;
  petitDej: boolean;
};

type ApiAccommodation = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  ville: string;
  type: string;
  prixParNuit: string;
  note: string;
  petitDejeuner: boolean;
};

type Vehicle = {
  id: string;
  photoUrl?: string | null;
  nom: string;
  ville: string;
  type: 'Citadine' | 'SUV' | 'Minibus';
  prixJour: number;
  transmission: 'Manuelle' | 'Automatique';
  climatisation: boolean;
};

type ApiVehicle = {
  id: string;
  nom: string;
  photoUrl?: string | null;
  ville: string;
  type: string;
  prixParJour: string;
  transmission: string;
  climatisation: boolean;
};

function formatXof(value: number) {
  return `${new Intl.NumberFormat('fr-FR').format(value)} XOF`;
}

export default function ReservationPage() {
  const router = useRouter();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [accommodationsError, setAccommodationsError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehiclesError, setVehiclesError] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('HEBERGEMENT');
  const [query, setQuery] = useState('');
  const [ville, setVille] = useState('Toutes');
  const [prixMax, setPrixMax] = useState(80000);
  const [noteMin, setNoteMin] = useState(8);
  const [petitDejOnly, setPetitDejOnly] = useState(false);
  const [transmission, setTransmission] = useState<
    'Toutes' | Vehicle['transmission']
  >('Toutes');
  const [climOnly, setClimOnly] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccommodations() {
      try {
        const response = await fetch('/api/accommodations');
        const data = (await response.json()) as
          | ApiAccommodation[]
          | { error?: string };

        if (!response.ok) {
          setAccommodationsError(
            (data as { error?: string }).error ??
              'Erreur chargement hébergements.',
          );
          setAccommodations([]);
          return;
        }

        const normalized = (data as ApiAccommodation[]).map((item) => ({
          id: item.id,
          nom: item.nom,
          photoUrl: item.photoUrl,
          ville: item.ville,
          type: (['Hotel', 'Appartement', 'Villa'].includes(item.type)
            ? item.type
            : 'Hotel') as Accommodation['type'],
          prixNuit: Number(item.prixParNuit),
          note: Number(item.note),
          petitDej: item.petitDejeuner,
        }));

        setAccommodations(normalized);
        setAccommodationsError('');
      } catch {
        setAccommodationsError('Erreur chargement hébergements.');
        setAccommodations([]);
      }
    }

    void loadAccommodations();
  }, []);

  useEffect(() => {
    async function loadVehicles() {
      try {
        const response = await fetch('/api/vehicle-rentals');
        const data = (await response.json()) as
          | ApiVehicle[]
          | { error?: string };

        if (!response.ok) {
          setVehiclesError(
            (data as { error?: string }).error ??
              'Erreur chargement véhicules.',
          );
          setVehicles([]);
          return;
        }

        const normalized = (data as ApiVehicle[]).map((item) => ({
          id: item.id,
          nom: item.nom,
          photoUrl: item.photoUrl,
          ville: item.ville,
          type: (['Citadine', 'SUV', 'Minibus'].includes(item.type)
            ? item.type
            : 'SUV') as Vehicle['type'],
          prixJour: Number(item.prixParJour),
          transmission: (['Manuelle', 'Automatique'].includes(item.transmission)
            ? item.transmission
            : 'Automatique') as Vehicle['transmission'],
          climatisation: item.climatisation,
        }));

        setVehicles(normalized);
        setVehiclesError('');
      } catch {
        setVehiclesError('Erreur chargement véhicules.');
        setVehicles([]);
      }
    }

    void loadVehicles();
  }, []);

  const accommodationCities = useMemo(
    () => ['Toutes', ...new Set(accommodations.map((item) => item.ville))],
    [accommodations],
  );
  const vehicleCities = useMemo(
    () => ['Toutes', ...new Set(vehicles.map((item) => item.ville))],
    [vehicles],
  );

  const filteredAccommodations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return accommodations.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.nom} ${item.ville} ${item.type}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCity = ville === 'Toutes' ? true : item.ville === ville;
      const matchesPrice = item.prixNuit <= prixMax;
      const matchesRating = item.note >= noteMin;
      const matchesBreakfast = petitDejOnly ? item.petitDej : true;

      return (
        matchesQuery &&
        matchesCity &&
        matchesPrice &&
        matchesRating &&
        matchesBreakfast
      );
    });
  }, [accommodations, query, ville, prixMax, noteMin, petitDejOnly]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vehicles.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        `${item.nom} ${item.ville} ${item.type}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCity = ville === 'Toutes' ? true : item.ville === ville;
      const matchesPrice = item.prixJour <= prixMax;
      const matchesTransmission =
        transmission === 'Toutes' ? true : item.transmission === transmission;
      const matchesClim = climOnly ? item.climatisation : true;

      return (
        matchesQuery &&
        matchesCity &&
        matchesPrice &&
        matchesTransmission &&
        matchesClim
      );
    });
  }, [vehicles, query, ville, prixMax, transmission, climOnly]);

  function switchService(nextService: ServiceType) {
    setServiceType(nextService);
    setQuery('');
    setVille('Toutes');
    setPrixMax(nextService === 'HEBERGEMENT' ? 80000 : 70000);
    setNoteMin(8);
    setPetitDejOnly(false);
    setTransmission('Toutes');
    setClimOnly(false);
  }

  async function handleBook(itemId: string) {
    setLoadingId(itemId);

    if (serviceType === 'HEBERGEMENT') {
      router.push(`/reservation/hebergement/${itemId}`);
      return;
    }

    router.push(`/reservation/vehicule/${itemId}`);
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10 lg:px-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold">Reservation</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Filtrez et réservez votre hébergement ou votre véhicule en Côte
          d’Ivoire.
        </p>
      </header>

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => switchService('HEBERGEMENT')}
            className={
              serviceType === 'HEBERGEMENT'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Hébergement
          </button>
          <button
            onClick={() => switchService('VEHICULE')}
            className={
              serviceType === 'VEHICULE'
                ? 'rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white'
                : 'rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15'
            }
          >
            Location de véhicule
          </button>
          <button
            onClick={() => router.push('/login')}
            className="ml-auto rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold dark:border-white/15"
          >
            Se connecter
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Filtres
          </h2>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recherche</label>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                serviceType === 'HEBERGEMENT'
                  ? 'Nom, type, ville...'
                  : 'Modèle, type, ville...'
              }
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ville</label>
            <select
              value={ville}
              onChange={(event) => setVille(event.target.value)}
              className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {(serviceType === 'HEBERGEMENT'
                ? accommodationCities
                : vehicleCities
              ).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Prix max ({formatXof(prixMax)})
            </label>
            <input
              type="range"
              min={20000}
              max={serviceType === 'HEBERGEMENT' ? 80000 : 70000}
              step={1000}
              value={prixMax}
              onChange={(event) => setPrixMax(Number(event.target.value))}
              className="w-full"
            />
          </div>

          {serviceType === 'HEBERGEMENT' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Note minimum ({noteMin}/10)
                </label>
                <input
                  type="range"
                  min={7}
                  max={10}
                  step={0.1}
                  value={noteMin}
                  onChange={(event) => setNoteMin(Number(event.target.value))}
                  className="w-full"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={petitDejOnly}
                  onChange={(event) => setPetitDejOnly(event.target.checked)}
                />
                Petit déjeuner inclus
              </label>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Transmission</label>
                <select
                  value={transmission}
                  onChange={(event) =>
                    setTransmission(
                      event.target.value as 'Toutes' | Vehicle['transmission'],
                    )
                  }
                  className="w-full rounded-xl border border-black/10 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                >
                  <option value="Toutes">Toutes</option>
                  <option value="Manuelle">Manuelle</option>
                  <option value="Automatique">Automatique</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={climOnly}
                  onChange={(event) => setClimOnly(event.target.checked)}
                />
                Climatisation uniquement
              </label>
            </>
          )}
        </aside>

        <div className="space-y-4">
          {accommodationsError && serviceType === 'HEBERGEMENT' ? (
            <p className="text-sm text-red-600">{accommodationsError}</p>
          ) : null}
          {vehiclesError && serviceType === 'VEHICULE' ? (
            <p className="text-sm text-red-600">{vehiclesError}</p>
          ) : null}
          {serviceType === 'HEBERGEMENT' ? (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredAccommodations.length} hébergement(s) trouvé(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredAccommodations.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900"
                  >
                    {item.photoUrl ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.nom}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        Aucune image
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{item.nom}</h2>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-800">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Note {item.note}/10 •{' '}
                      {item.petitDej
                        ? 'Petit déjeuner inclus'
                        : 'Sans petit déjeuner'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {formatXof(item.prixNuit)} / nuit
                      </p>
                      <button
                        onClick={() => handleBook(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id ? 'Réservation...' : 'Réserver'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          ) : (
            <>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                {filteredVehicles.length} véhicule(s) trouvé(s)
              </p>
              <section className="grid gap-4 md:grid-cols-2">
                {filteredVehicles.map((item) => (
                  <article
                    key={item.id}
                    className="space-y-3 rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900"
                  >
                    {item.photoUrl ? (
                      <div className="relative h-40 w-full overflow-hidden rounded-xl">
                        <Image
                          src={item.photoUrl}
                          alt={item.nom}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                        Aucune image
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold">{item.nom}</h2>
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold dark:bg-zinc-800">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      📍 {item.ville}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {item.transmission} •{' '}
                      {item.climatisation
                        ? 'Climatisation'
                        : 'Sans climatisation'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {formatXof(item.prixJour)} / jour
                      </p>
                      <button
                        onClick={() => handleBook(item.id)}
                        disabled={loadingId === item.id}
                        className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
                      >
                        {loadingId === item.id ? 'Réservation...' : 'Réserver'}
                      </button>
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
