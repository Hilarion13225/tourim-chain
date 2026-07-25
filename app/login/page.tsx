'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const tourismLeisureByType = [
  {
    type: 'Balnéaire',
    loisirs: ['Plage', 'Baignade', 'Coucher de soleil', 'Sports nautiques'],
  },
  {
    type: 'Culturel',
    loisirs: [
      'Musées',
      'Sites historiques',
      'Festivals traditionnels',
      'Artisanat local',
    ],
  },
  {
    type: 'Nature & Écotourisme',
    loisirs: ['Randonnée', 'Parcs naturels', 'Observation de la faune', 'Cascade'],
  },
  {
    type: 'Aventure & Sportif',
    loisirs: ['Tyrolienne', 'Quad', 'Escalade', 'Sorties sportives'],
  },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('TOURIST');
  const [touristAge, setTouristAge] = useState('');
  const [touristLeisures, setTouristLeisures] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  function toggleTouristLeisure(value: string) {
    setTouristLeisures((previous) =>
      previous.includes(value)
        ? previous.filter((item) => item !== value)
        : [...previous, value],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint =
        mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : {
              nom,
              email,
              password,
              phone: telephone,
              role,
              age: role === 'TOURIST' ? Number(touristAge) : undefined,
              loisirs:
                role === 'TOURIST'
                  ? touristLeisures.join(', ')
                  : undefined,
            };

      if (mode === 'register' && !acceptTerms) {
        setError('Veuillez accepter les conditions pour continuer.');
        return;
      }

      if (mode === 'register' && role === 'TOURIST') {
        const age = Number(touristAge);

        if (!touristAge || Number.isNaN(age) || age < 10 || age > 120) {
          setError('Veuillez renseigner un âge valide (10 à 120 ans).');
          return;
        }

        if (touristLeisures.length === 0) {
          setError(
            'Sélectionnez au moins un loisir selon les 4 types de tourisme.',
          );
          return;
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        error?: string;
        dashboardPath?: string;
      };

      if (!response.ok) {
        setError(data.error ?? 'Échec de connexion');
        return;
      }

      if (mode === 'login' && returnTo) {
        router.push(returnTo);
        return;
      }

      router.push(data.dashboardPath ?? '/dashboard/touriste');
    } catch {
      setError('Erreur réseau, veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-[#f6f7fb] dark:bg-zinc-950">
      <section className="mx-auto grid w-full max-w-7xl lg:grid-cols-2">
        <div className="flex items-center justify-center px-6 py-10 lg:px-12">
          <div className="w-full max-w-md space-y-6">
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white p-1 dark:border-white/15 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === 'register'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Inscription
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
                  mode === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                Connexion
              </button>
            </div>

            <header>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                {mode === 'register'
                  ? 'Rejoignez l’Aventure'
                  : 'Bon retour sur tourisme Ci'}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {mode === 'register'
                  ? 'Découvrez la Côte d’Ivoire autrement avec tourisme Ci.'
                  : 'Connectez-vous pour accéder à vos réservations et votre dashboard.'}
              </p>
            </header>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                    type="text"
                    placeholder="Nom complet"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                    required
                  />
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                    type="tel"
                    placeholder="+225 07 00 00 00"
                    value={telephone}
                    onChange={(event) => setTelephone(event.target.value)}
                    required
                  />
                </div>
              ) : null}

              {mode === 'register' ? (
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value);
                    if (event.target.value !== 'TOURIST') {
                      setTouristAge('');
                      setTouristLeisures([]);
                    }
                  }}
                >
                  <option value="TOURIST">Touriste</option>
                  <option value="GUIDE">Guide</option>
                  <option value="ARTISAN">Artisan</option>
                  <option value="ORGANIZER">Organisateur</option>
                  <option value="ACCOMMODATION_COMPANY">
                    Entreprise d’hébergement
                  </option>
                  <option value="VEHICLE_RENTAL_COMPANY">
                    Entreprise de location de véhicule
                  </option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              ) : null}

              {mode === 'register' && role === 'TOURIST' ? (
                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-white/15 dark:bg-zinc-900">
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    Questions profil touriste
                  </p>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Âge
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                      type="number"
                      min={10}
                      max={120}
                      placeholder="Ex: 28"
                      value={touristAge}
                      onChange={(event) => setTouristAge(event.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Loisirs selon les 4 types de tourisme ivoirien
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {tourismLeisureByType.map((group) => (
                        <fieldset
                          key={group.type}
                          className="rounded-xl border border-zinc-200 p-3 dark:border-white/15"
                        >
                          <legend className="px-1 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                            {group.type}
                          </legend>
                          <div className="mt-2 space-y-2">
                            {group.loisirs.map((loisir) => {
                              const value = `${group.type}: ${loisir}`;

                              return (
                                <label
                                  key={value}
                                  className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"
                                >
                                  <input
                                    type="checkbox"
                                    checked={touristLeisures.includes(value)}
                                    onChange={() => toggleTouristLeisure(value)}
                                  />
                                  <span>{loisir}</span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {touristLeisures.length} loisir(s) sélectionné(s)
                    </p>
                  </div>
                </div>
              ) : null}

              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                type="email"
                placeholder="Identifiant (email)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-white/15 dark:bg-zinc-900"
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              {mode === 'register' ? (
                <label className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={acceptTerms}
                    onChange={(event) => setAcceptTerms(event.target.checked)}
                  />
                  <span>
                    J’accepte les conditions d’utilisation et la politique de
                    données.
                  </span>
                </label>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}

              <button
                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                type="submit"
                disabled={isLoading}
              >
                {isLoading
                  ? mode === 'login'
                    ? 'Connexion...'
                    : 'Création...'
                  : mode === 'login'
                    ? 'Se connecter'
                    : 'Ouvrir mon compte'}
              </button>
            </form>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              {mode === 'register'
                ? 'Déjà inscrit ?'
                : 'Pas encore de compte ?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'register' ? 'login' : 'register');
                  setError('');
                }}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                {mode === 'register' ? 'Se connecter' : 'S’inscrire'}
              </button>
            </p>
          </div>
        </div>

        <aside className="relative hidden overflow-hidden bg-linear-to-br from-[#122a96] via-[#2040c3] to-[#2545cc] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-2xl font-extrabold tracking-tight">
              tourisme <span className="text-cyan-300">Ci</span>
            </p>
            <h2 className="mt-20 max-w-md text-5xl font-extrabold leading-[1.1]">
              Explorez la Côte d’Ivoire,
              <br />
              <span className="text-blue-200">avec une confiance absolue.</span>
            </h2>

            <div className="mt-10 space-y-4">
              <article className="rounded-2xl border border-white/35 bg-white/5 p-4 backdrop-blur">
                <p className="flex items-center gap-3 font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
                    1
                  </span>
                  Créez votre profil complet
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  Les profils renseignés ont plus de visibilité et de matchs.
                </p>
              </article>

              <article className="rounded-2xl border border-white/35 bg-white/5 p-4 backdrop-blur">
                <p className="flex items-center gap-3 font-semibold">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm">
                    2
                  </span>
                  Passez par la certification
                </p>
                <p className="mt-2 text-sm text-blue-100">
                  KYC simplifié pour les profils prestataires et pros.
                </p>
              </article>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <div className="flex -space-x-2">
                <span className="h-7 w-7 rounded-full bg-white/70" />
                <span className="h-7 w-7 rounded-full bg-white/50" />
                <span className="h-7 w-7 rounded-full bg-white/30" />
              </div>
              +500 professionnels inscrits ce mois-ci
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
