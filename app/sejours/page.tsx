'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ServiceTabs from '@/app/_components/service-tabs';

type Property = {
  name: string;
  area: string;
  distance: string;
  score: number;
  scoreLabel: string;
  reviews: string;
  location: string;
  description: string;
  badge?: string;
  propertyType: 'Hotel' | 'Apartment' | 'Bed and Breakfast' | 'Tour';
  stars: 1 | 2 | 3 | 4 | 5;
  tourismType: 'CULTUREL' | 'BALNEAIRE' | 'ECOTOURISME' | 'URBAIN_EVENT';
  destination: string;
  activities: string[];
};

const properties: Property[] = [
  {
    name: 'Circuit Patrimoine Grand-Bassam',
    area: 'Grand-Bassam, Côte d’Ivoire',
    distance: '45 min depuis Abidjan',
    score: 9.1,
    scoreLabel: 'Fabulous',
    reviews: '1,130 reviews',
    location: 'Localisation 9.4',
    description:
      'Découverte du patrimoine colonial, des quartiers historiques, des maisons anciennes et immersion dans les traditions locales.',
    badge: 'Patrimoine historique',
    propertyType: 'Tour',
    stars: 4,
    tourismType: 'CULTUREL',
    destination: 'Grand-Bassam',
    activities: [
      'danses traditionnelles',
      'villages traditionnels',
      'artisanat',
    ],
  },
  {
    name: 'Musée des Civilisations + Gastronomie locale',
    area: 'Abidjan, Côte d’Ivoire',
    distance: 'Centre-ville',
    score: 8.8,
    scoreLabel: 'Very good',
    reviews: '780 reviews',
    location: 'Localisation 9.2',
    description:
      'Parcours culturel national avec visite guidée et expérience culinaire ivoirienne en fin de journée.',
    badge: 'Culture nationale',
    propertyType: 'Tour',
    stars: 4,
    tourismType: 'CULTUREL',
    destination: 'Abidjan',
    activities: ['musées', 'gastronomie locale', 'arts africains'],
  },
  {
    name: 'Resort Week-end Assinie-Mafia',
    area: 'Assinie-Mafia, Côte d’Ivoire',
    distance: '2h depuis Abidjan',
    score: 9.1,
    scoreLabel: 'Superb',
    reviews: '1,905 reviews',
    location: 'Localisation 9.6',
    description:
      'Séjour balnéaire avec plages privées, hôtels en bord de mer, activités nautiques et détente familiale.',
    badge: 'Top plages',
    propertyType: 'Apartment',
    stars: 4,
    tourismType: 'BALNEAIRE',
    destination: 'Assinie-Mafia',
    activities: ['plages', 'sports nautiques', 'week-end touristique'],
  },
  {
    name: 'Évasion Grand-Béréby Océan',
    area: 'Grand-Béréby, Côte d’Ivoire',
    distance: 'Sud-Ouest',
    score: 8.7,
    scoreLabel: 'Fabulous',
    reviews: '640 reviews',
    location: 'Localisation 8.9',
    description:
      'Expérience balnéaire premium, cocotiers, hôtels de charme et excursions en mer.',
    badge: 'Plage & détente',
    propertyType: 'Hotel',
    stars: 4,
    tourismType: 'BALNEAIRE',
    destination: 'Grand-Béréby',
    activities: ['plages', 'hôtels', 'détente'],
  },
  {
    name: 'Parc National de Taï - Safari Durable',
    area: 'Taï, Côte d’Ivoire',
    distance: 'Parc classé UNESCO',
    score: 9.0,
    scoreLabel: 'Superb',
    reviews: '422 reviews',
    location: 'Localisation 9.0',
    description:
      'Forêt primaire classée UNESCO, observation de la faune, randonnée encadrée et programme écotouristique durable.',
    badge: 'Écotourisme',
    propertyType: 'Tour',
    stars: 4,
    tourismType: 'ECOTOURISME',
    destination: 'Parc de Taï',
    activities: [
      'safari',
      'randonnée',
      'observation animale',
      'tourisme durable',
    ],
  },
  {
    name: 'Parc National de la Comoé - Nature Aventure',
    area: 'Comoé, Côte d’Ivoire',
    distance: 'Nord-Est',
    score: 8.5,
    scoreLabel: 'Very good',
    reviews: '388 reviews',
    location: 'Localisation 8.7',
    description:
      'Séjour nature avec circuits écoresponsables, observation de la biodiversité et immersion en milieux protégés.',
    badge: 'Nature & biodiversité',
    propertyType: 'Tour',
    stars: 4,
    tourismType: 'ECOTOURISME',
    destination: 'Parc de la Comoé',
    activities: ['safari', 'randonnée', 'tourisme durable'],
  },
  {
    name: 'Abidjan Nightlife & Business Stay',
    area: 'Abidjan, Côte d’Ivoire',
    distance: 'Plateau / Marcory',
    score: 8.0,
    scoreLabel: 'Very good',
    reviews: '1,542 reviews',
    location: 'Localisation 9.1',
    description:
      'Tourisme urbain mêlant restaurants, vie nocturne, concerts et hébergements adaptés au business tourism.',
    badge: 'Urbain & événementiel',
    propertyType: 'Hotel',
    stars: 5,
    tourismType: 'URBAIN_EVENT',
    destination: 'Abidjan',
    activities: ['nightlife', 'restaurants', 'concerts', 'business tourism'],
  },
  {
    name: 'Pack FEMUA Expérience',
    area: 'Abidjan, Côte d’Ivoire',
    distance: 'Festival urbain',
    score: 8.9,
    scoreLabel: 'Fabulous',
    reviews: '902 reviews',
    location: 'Localisation 9.0',
    description:
      'Pack événementiel autour du FEMUA avec hébergement, accès concerts et navettes dédiées.',
    badge: 'Événement majeur',
    propertyType: 'Bed and Breakfast',
    stars: 3,
    tourismType: 'URBAIN_EVENT',
    destination: 'Abidjan',
    activities: ['FEMUA', 'concerts', 'conférences internationales'],
  },
];

const popularFilters = [
  ['Hotels', '1807'],
  ['4 stars', '656'],
  ['Apartments', '10180'],
  ['Bed and breakfasts', '89'],
  ['Superb: 9+', '2485'],
  ['Balcony', '1428'],
  ['Air conditioning', '3831'],
  ['Holiday homes', '210'],
];

const propertyTypes = [
  ['Apartments', '10180'],
  ['Hotels', '1807'],
  ['Holiday homes', '210'],
  ['Homestays', '132'],
  ['Hostels', '36'],
  ['Guest houses', '33'],
  ['Villas', '10'],
  ['Boats', '2'],
];

const facilities = [
  ['Parking', '1419'],
  ['Restaurant', '317'],
  ['Room service', '838'],
  ['24-hour front desk', '2425'],
  ['Fitness centre', '461'],
];

const neighbourhoods = [
  ['Paris City Centre', '5241'],
  ['Le Marais', '1352'],
  ['2nd arr.', '980'],
  ['15th arr.', '966'],
  ['16th arr.', '847'],
];

const tourismTypeMeta = {
  CULTUREL: {
    label: 'Tourisme culturel',
    emoji: '🇨🇮',
    hint: 'danses, rites, artisanat, festivals, gastronomie',
  },
  BALNEAIRE: {
    label: 'Tourisme balnéaire',
    emoji: '🏖️',
    hint: 'plages, hôtels, sports nautiques, week-end',
  },
  ECOTOURISME: {
    label: 'Écotourisme',
    emoji: '🌳',
    hint: 'safari, randonnée, biodiversité, durable',
  },
  URBAIN_EVENT: {
    label: 'Tourisme urbain et événementiel',
    emoji: '🏙️',
    hint: 'nightlife, restaurants, concerts, business, FEMUA',
  },
} as const;

export default function SejoursPage() {
  const searchParams = useSearchParams();
  const [destination, setDestination] = useState('Côte d’Ivoire');
  const [showMap, setShowMap] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2 adults · 0 children · 1 room');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<
    'All' | Property['propertyType']
  >('All');
  const [minScore, setMinScore] = useState(0);
  const [manualTourismType, setManualTourismType] = useState<
    'ALL' | Property['tourismType'] | null
  >(null);

  const tourismTypeFromQuery = useMemo<'ALL' | Property['tourismType']>(() => {
    const type = searchParams.get('type');

    if (
      type === 'CULTUREL' ||
      type === 'BALNEAIRE' ||
      type === 'ECOTOURISME' ||
      type === 'URBAIN_EVENT'
    ) {
      return type;
    }

    return 'ALL';
  }, [searchParams]);

  const tourismType = manualTourismType ?? tourismTypeFromQuery;

  const tourismTypeCounts = useMemo(() => {
    return {
      CULTUREL: properties.filter(
        (property) => property.tourismType === 'CULTUREL',
      ).length,
      BALNEAIRE: properties.filter(
        (property) => property.tourismType === 'BALNEAIRE',
      ).length,
      ECOTOURISME: properties.filter(
        (property) => property.tourismType === 'ECOTOURISME',
      ).length,
      URBAIN_EVENT: properties.filter(
        (property) => property.tourismType === 'URBAIN_EVENT',
      ).length,
    };
  }, []);

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch =
        `${property.name} ${property.area} ${property.destination} ${property.activities.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesType =
        typeFilter === 'All' ? true : property.propertyType === typeFilter;
      const matchesScore = property.score >= minScore;
      const matchesTourismType =
        tourismType === 'ALL' ? true : property.tourismType === tourismType;
      const normalizedDestination = destination.trim().toLowerCase();
      const matchesDestination =
        !normalizedDestination ||
        `${property.destination} ${property.area}`
          .toLowerCase()
          .includes(normalizedDestination);
      return (
        matchesSearch &&
        matchesType &&
        matchesScore &&
        matchesTourismType &&
        matchesDestination
      );
    });
  }, [query, typeFilter, minScore, tourismType, destination]);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <ServiceTabs />

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-300">
            <span className="rounded-full bg-zinc-100 px-3 py-1 font-semibold dark:bg-zinc-800">
              XOF
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="rounded-xl border border-black/10 px-3 py-2 font-medium dark:border-white/15">
              List your property
            </button>
            <button className="rounded-xl border border-black/10 px-3 py-2 font-medium dark:border-white/15">
              Register
            </button>
            <button className="rounded-xl bg-orange-500 px-3 py-2 font-semibold text-white">
              Sign in
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl border border-orange-300 bg-orange-50 p-3 md:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] dark:border-orange-700 dark:bg-orange-950/20">
          <input
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Côte d’Ivoire, Abidjan, Grand-Bassam..."
          />
          <input
            type="date"
            value={checkIn}
            onChange={(event) => setCheckIn(event.target.value)}
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Check-in date"
          />
          <input
            type="date"
            value={checkOut}
            onChange={(event) => setCheckOut(event.target.value)}
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Check-out date"
          />
          <input
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="2 adults · 0 children · 1 room"
          />
          <button className="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-700">
            Search
          </button>
        </div>
      </section>

      <div className="space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        <p>Home / Côte d’Ivoire / Recherche / Résultats</p>
        <button
          onClick={() => setShowMap((value) => !value)}
          className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium dark:border-white/15"
        >
          {showMap ? 'Hide map' : 'Show on map'}
        </button>
      </div>

      {showMap ? (
        <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Carte des séjours (mock)</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Abidjan · Grand-Bassam · Assinie · Taï · Comoé
            </p>
          </div>
          <div className="relative h-56 overflow-hidden rounded-xl bg-[radial-gradient(circle_at_20%_20%,#bfdbfe,transparent_38%),radial-gradient(circle_at_80%_30%,#86efac,transparent_35%),linear-gradient(135deg,#e2e8f0,#cbd5e1)] dark:bg-[radial-gradient(circle_at_20%_20%,#1e3a8a,transparent_38%),radial-gradient(circle_at_80%_30%,#14532d,transparent_35%),linear-gradient(135deg,#1f2937,#334155)]">
            <span className="absolute left-[22%] top-[42%] rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
              Abidjan
            </span>
            <span className="absolute left-[35%] top-[48%] rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
              Grand-Bassam
            </span>
            <span className="absolute left-[42%] top-[52%] rounded-full bg-orange-500 px-2 py-1 text-xs font-semibold text-white">
              Assinie
            </span>
            <span className="absolute left-[12%] top-[35%] rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
              Taï
            </span>
            <span className="absolute left-[63%] top-[30%] rounded-full bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
              Comoé
            </span>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4 rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Filter by:</h2>

          <div className="space-y-2 border-b border-black/10 pb-4 dark:border-white/15">
            <h3 className="text-sm font-semibold">
              4 types de tourisme (Côte d’Ivoire)
            </h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-2 py-2 dark:border-white/15">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="tourismType"
                    checked={tourismType === 'ALL'}
                    onChange={() => setManualTourismType('ALL')}
                  />
                  Tous les types
                </span>
                <span>{properties.length}</span>
              </label>

              {(
                Object.keys(tourismTypeMeta) as Array<
                  keyof typeof tourismTypeMeta
                >
              ).map((key) => (
                <label
                  key={key}
                  className="space-y-1 rounded-lg border border-zinc-200 px-2 py-2 dark:border-white/15"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tourismType"
                        checked={tourismType === key}
                        onChange={() => setManualTourismType(key)}
                      />
                      <span>
                        {tourismTypeMeta[key].emoji}{' '}
                        {tourismTypeMeta[key].label}
                      </span>
                    </span>
                    <span>{tourismTypeCounts[key]}</span>
                  </div>
                  <p className="pl-6 text-xs text-zinc-500 dark:text-zinc-400">
                    {tourismTypeMeta[key].hint}
                  </p>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Quick search in results</h3>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type hotel name or area"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-white/15"
            />
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">
              Property type (interactive)
            </h3>
            <div className="space-y-2 text-sm">
              {(
                ['All', 'Hotel', 'Apartment', 'Bed and Breakfast'] as const
              ).map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="propertyType"
                    checked={typeFilter === option}
                    onChange={() => setTypeFilter(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">
              Review score (interactive)
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['Any score', 0],
                ['Good: 7+', 7],
                ['Very good: 8+', 8],
                ['Superb: 9+', 9],
              ].map(([label, value]) => (
                <label key={label} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="score"
                    checked={minScore === Number(value)}
                    onChange={() => setMinScore(Number(value))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">Popular filters</h3>
            <ul className="space-y-1 text-sm">
              {popularFilters.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-zinc-500">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">Property type</h3>
            <ul className="space-y-1 text-sm">
              {propertyTypes.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-zinc-500">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">Facilities</h3>
            <ul className="space-y-1 text-sm">
              {facilities.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-zinc-500">{count}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/15">
            <h3 className="text-sm font-semibold">Neighbourhood</h3>
            <ul className="space-y-1 text-sm">
              {neighbourhoods.map(([label, count]) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="text-zinc-500">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="space-y-4">
          <header className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
            <p className="text-xl font-semibold">
              Côte d’Ivoire: {filteredProperties.length} offres trouvées
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Résultats centrés sur les 4 types de tourisme ivoirien.
            </p>
          </header>

          {filteredProperties.length === 0 ? (
            <p className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/15 dark:bg-zinc-900">
              No property matches your filters.
            </p>
          ) : (
            filteredProperties.map((property) => (
              <article
                key={property.name}
                className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-4 md:flex-row md:justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300">
                      {property.name}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {property.area} · {property.distance}
                    </p>
                    {property.badge ? (
                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {property.badge}
                      </span>
                    ) : null}
                    <p className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">
                      {
                        tourismTypeMeta[
                          property.tourismType as keyof typeof tourismTypeMeta
                        ].label
                      }
                    </p>
                    <p className="max-w-3xl text-sm text-zinc-700 dark:text-zinc-200">
                      {property.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {property.activities.map((activity) => (
                        <span
                          key={activity}
                          className="rounded-full border border-zinc-200 px-2 py-1 text-xs dark:border-white/15"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex min-w-[180px] flex-col items-start gap-2 md:items-end">
                    <div className="text-right">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Scored {property.score}
                      </p>
                      <p className="font-semibold">{property.scoreLabel}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {property.reviews}
                      </p>
                      <p className="text-sm font-medium">{property.location}</p>
                    </div>
                    <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                      Show prices
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
