'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type UserItem = {
  id: string;
  nom: string;
  email: string;
  role: string;
  status: string;
  verified: boolean;
};

type GuideItem = {
  id: string;
  nom: string;
  email: string;
  status: string;
  verified: boolean;
};

type TourismAdminCategory = 'CULTUREL' | 'BALNEAIRE' | 'ECOTOURISME' | 'URBAN';

type TourismSiteItem = {
  id: string;
  slug: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
  isActive: boolean;
  medias?: Array<{
    id: string;
    url: string;
    type: string;
  }>;
};

const categoryLabel: Record<TourismAdminCategory, string> = {
  CULTUREL: 'Culturel',
  BALNEAIRE: 'Balnéaire',
  ECOTOURISME: 'Écotourisme',
  URBAN: 'Urban',
};

const categoryTourismLabel: Record<TourismAdminCategory, string> = {
  CULTUREL: 'Tourisme culturel',
  BALNEAIRE: 'Tourisme balnéaire',
  ECOTOURISME: 'Tourisme écotourisme',
  URBAN: 'Tourisme urban',
};

const tourismDefaultValues = {
  nom: 'Circuit Patrimoine de Grand-Bassam',
  region: 'Sud-Comoé',
  description:
    'Visite guidée du patrimoine historique, artisanat local et immersion culturelle.',
  priceXof: 18000,
  durationHours: 4,
  category: 'CULTUREL' as TourismAdminCategory,
};

const categoryToApi: Record<TourismAdminCategory, string> = {
  CULTUREL: 'CULTUREL',
  BALNEAIRE: 'BALNEAIRE',
  ECOTOURISME: 'ECOTOURISME',
  URBAN: 'URBAN',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 50);
}

function mapApiCategoryToAdmin(category: string): TourismAdminCategory {
  switch (category) {
    case 'CULTURE':
      return 'CULTUREL';
    case 'BEACH':
      return 'BALNEAIRE';
    case 'NATURE':
      return 'ECOTOURISME';
    default:
      return 'URBAN';
  }
}

function parseTourismMeta(description: string) {
  const fallback = {
    summary: description,
    priceXof: 10000,
    durationHours: 4,
  };

  if (!description.startsWith('__TOURISM_META__')) {
    return fallback;
  }

  const firstLineBreak = description.indexOf('\n');
  const metaLine =
    firstLineBreak >= 0 ? description.slice(0, firstLineBreak) : description;
  const rawJson = metaLine.replace('__TOURISM_META__', '');
  const summary =
    firstLineBreak >= 0 ? description.slice(firstLineBreak + 1) : '';

  try {
    const parsed = JSON.parse(rawJson) as {
      priceXof?: number;
      durationHours?: number;
    };

    return {
      summary: summary || fallback.summary,
      priceXof: Number(parsed.priceXof ?? fallback.priceXof),
      durationHours: Number(parsed.durationHours ?? fallback.durationHours),
    };
  } catch {
    return fallback;
  }
}

function buildTourismDescription(params: {
  summary: string;
  priceXof: number;
  durationHours: number;
}) {
  return `__TOURISM_META__${JSON.stringify({
    priceXof: params.priceXof,
    durationHours: params.durationHours,
  })}\n${params.summary}`;
}

export default function AdminCrudClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [sites, setSites] = useState<TourismSiteItem[]>([]);
  const [siteGuides, setSiteGuides] = useState<Record<string, GuideItem[]>>({});
  const [selectedGuideBySite, setSelectedGuideBySite] = useState<
    Record<string, string>
  >({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingSiteId, setEditingSiteId] = useState<string | null>(null);

  const [siteNom, setSiteNom] = useState(tourismDefaultValues.nom);
  const [siteRegion, setSiteRegion] = useState(tourismDefaultValues.region);
  const [siteCategory, setSiteCategory] = useState<TourismAdminCategory>(
    tourismDefaultValues.category,
  );
  const [siteDescription, setSiteDescription] = useState(
    tourismDefaultValues.description,
  );
  const [sitePriceXof, setSitePriceXof] = useState(
    tourismDefaultValues.priceXof,
  );
  const [siteDurationHours, setSiteDurationHours] = useState(
    tourismDefaultValues.durationHours,
  );
  const [siteSlug, setSiteSlug] = useState('');
  const [sitePhotoUrl, setSitePhotoUrl] = useState('');
  const [sitePhotoName, setSitePhotoName] = useState('');
  const [guideNom, setGuideNom] = useState('');
  const [guideEmail, setGuideEmail] = useState('');
  const [guidePassword, setGuidePassword] = useState('');
  const [guideRegion, setGuideRegion] = useState('');

  function resetTourismForm() {
    setEditingSiteId(null);
    setSiteNom(tourismDefaultValues.nom);
    setSiteRegion(tourismDefaultValues.region);
    setSiteDescription(tourismDefaultValues.description);
    setSiteSlug('');
    setSitePriceXof(tourismDefaultValues.priceXof);
    setSiteDurationHours(tourismDefaultValues.durationHours);
    setSiteCategory(tourismDefaultValues.category);
    setSitePhotoUrl('');
    setSitePhotoName('');
  }

  function startEditSite(site: TourismSiteItem) {
    const meta = parseTourismMeta(site.description);
    const adminCategory = mapApiCategoryToAdmin(site.categorieTourisme);
    const imageMedia = site.medias?.find((media) => media.type === 'IMAGE');

    setEditingSiteId(site.id);
    setSiteNom(site.nom);
    setSiteRegion(site.region);
    setSiteCategory(adminCategory);
    setSiteDescription(meta.summary);
    setSitePriceXof(meta.priceXof);
    setSiteDurationHours(meta.durationHours);
    setSiteSlug(site.slug);
    setSitePhotoUrl(imageMedia?.url ?? '');
    setSitePhotoName('');
    setError('');
    setMessage('');
  }

  async function loadUsers() {
    const response = await fetch('/api/users');
    const data = (await response.json()) as UserItem[] | { error?: string };

    if (!response.ok) {
      setError((data as { error?: string }).error ?? 'Erreur chargement users');
      return;
    }

    setUsers(data as UserItem[]);
  }

  async function loadGuides() {
    const response = await fetch('/api/users?role=GUIDE');
    const data = (await response.json()) as GuideItem[] | { error?: string };

    if (!response.ok) {
      setError(
        (data as { error?: string }).error ?? 'Erreur chargement guides',
      );
      return;
    }

    setGuides(data as GuideItem[]);
  }

  async function loadSiteAffiliations(siteList: TourismSiteItem[]) {
    const entries = await Promise.all(
      siteList.map(async (site) => {
        const response = await fetch(`/api/sites/${site.id}/guides`);

        if (!response.ok) {
          return [site.id, [] as GuideItem[]] as const;
        }

        const data = (await response.json()) as GuideItem[];
        return [site.id, data] as const;
      }),
    );

    setSiteGuides(Object.fromEntries(entries));
  }

  async function loadSites() {
    const response = await fetch('/api/sites?includeInactive=1');
    const data = (await response.json()) as
      | TourismSiteItem[]
      | { error?: string };

    if (!response.ok) {
      setError((data as { error?: string }).error ?? 'Erreur chargement sites');
      return;
    }

    const nextSites = data as TourismSiteItem[];
    setSites(nextSites);
    await loadSiteAffiliations(nextSites);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
      void loadGuides();
      void loadSites();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleVerification(user: UserItem) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !user.verified }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour impossible');
      return;
    }

    setMessage('Vérification mise à jour');
    await loadUsers();
  }

  async function suspendUser(user: UserItem) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suspension impossible');
      return;
    }

    setMessage('Utilisateur suspendu');
    await loadUsers();
  }

  async function deleteUser(id: string) {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    setMessage('Utilisateur supprimé');
    await loadUsers();
  }

  async function createTourismSite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const nom = siteNom.trim();
    const region = siteRegion.trim();
    const summary = siteDescription.trim();

    if (!nom || !region || !summary) {
      setError('Nom, région et description sont requis.');
      return;
    }

    const computedSlug =
      siteSlug.trim() || `${slugify(nom)}-${Date.now().toString(36).slice(-4)}`;
    const endpoint = editingSiteId
      ? `/api/sites/${editingSiteId}`
      : '/api/sites';
    const method = editingSiteId ? 'PATCH' : 'POST';

    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(editingSiteId ? {} : { slug: computedSlug }),
        nom,
        region,
        description: buildTourismDescription({
          summary,
          priceXof: sitePriceXof,
          durationHours: siteDurationHours,
        }),
        categorieTourisme: categoryToApi[siteCategory],
        ...(sitePhotoUrl ? { photoUrl: sitePhotoUrl } : {}),
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création du site impossible');
      return;
    }

    setMessage(
      editingSiteId ? 'Site touristique modifié' : 'Site touristique créé',
    );
    resetTourismForm();
    await loadSites();
  }

  async function createGuide(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');

    const nom = guideNom.trim();
    const email = guideEmail.trim();
    const password = guidePassword.trim();

    if (!nom || !email || !password) {
      setError('Nom, email et mot de passe du guide sont requis.');
      return;
    }

    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom,
        email,
        password,
        role: 'GUIDE',
        guideRegion: guideRegion.trim() || undefined,
      }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Création guide impossible');
      return;
    }

    setMessage('Guide ajouté avec succès');
    setGuideNom('');
    setGuideEmail('');
    setGuidePassword('');
    setGuideRegion('');
    await loadUsers();
    await loadGuides();
  }

  async function affiliateGuideToSite(siteId: string) {
    const guideId = selectedGuideBySite[siteId];

    if (!guideId) {
      setError('Sélectionnez un guide principal.');
      return;
    }

    setError('');
    setMessage('');

    const response = await fetch(`/api/sites/${siteId}/guides`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guideId }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Affectation du guide principal impossible');
      return;
    }

    setMessage('Guide principal affecté au site');
    await loadSites();
  }

  async function removeGuideAffiliation(siteId: string, guideId: string) {
    setError('');
    setMessage('');

    const response = await fetch(`/api/sites/${siteId}/guides/${guideId}`, {
      method: 'DELETE',
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression du guide principal impossible');
      return;
    }

    setMessage('Guide principal retiré du site');
    await loadSites();
  }

  async function handleSitePhotoChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide.');
      return;
    }

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('image_read_failed'));
      reader.readAsDataURL(file);
    });

    setSitePhotoUrl(base64);
    setSitePhotoName(file.name);
  }

  async function toggleSiteActive(site: TourismSiteItem) {
    const response = await fetch(`/api/sites/${site.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !site.isActive }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour du site impossible');
      return;
    }

    setMessage(site.isActive ? 'Site désactivé' : 'Site activé');
    await loadSites();
  }

  async function deleteSite(id: string) {
    const response = await fetch(`/api/sites/${id}`, { method: 'DELETE' });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression du site impossible');
      return;
    }

    setMessage('Site supprimé');
    await loadSites();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="text-lg font-semibold">CRUD Admin — Utilisateurs</h2>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

        <div className="space-y-2">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
            >
              <p className="font-medium">
                {user.nom} ({user.role})
              </p>
              <p>{user.email}</p>
              <p>Statut: {user.status}</p>
              <p>Vérifié: {user.verified ? 'Oui' : 'Non'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => void toggleVerification(user)}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  Toggle vérification
                </button>
                <button
                  onClick={() => void suspendUser(user)}
                  className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                >
                  Suspendre
                </button>
                <button
                  onClick={() => void deleteUser(user.id)}
                  className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
        <h2 className="text-lg font-semibold">CRUD Admin — Tourisme</h2>

        <form onSubmit={createGuide} className="grid gap-2 md:grid-cols-4">
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Nom du guide"
            value={guideNom}
            onChange={(event) => setGuideNom(event.target.value)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="email"
            placeholder="Email du guide"
            value={guideEmail}
            onChange={(event) => setGuideEmail(event.target.value)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Région du guide"
            value={guideRegion}
            onChange={(event) => setGuideRegion(event.target.value)}
          />
          <div className="flex gap-2">
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="password"
              placeholder="Mot de passe"
              value={guidePassword}
              onChange={(event) => setGuidePassword(event.target.value)}
              required
            />
            <button className="rounded-lg border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/15">
              Ajouter guide
            </button>
          </div>
        </form>

        <form
          onSubmit={createTourismSite}
          className="grid gap-2 md:grid-cols-3"
        >
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Titre de l'activité"
            value={siteNom}
            onChange={(event) => setSiteNom(event.target.value)}
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Région"
            value={siteRegion}
            onChange={(event) => setSiteRegion(event.target.value)}
            required
          />
          <select
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            value={siteCategory}
            onChange={(event) =>
              setSiteCategory(event.target.value as TourismAdminCategory)
            }
          >
            {(Object.keys(categoryLabel) as TourismAdminCategory[]).map(
              (item) => (
                <option key={item} value={item}>
                  {categoryLabel[item]}
                </option>
              ),
            )}
          </select>
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="number"
            min={1000}
            placeholder="Prix (XOF)"
            value={sitePriceXof}
            onChange={(event) =>
              setSitePriceXof(Number(event.target.value) || 1000)
            }
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            type="number"
            min={1}
            placeholder="Durée (heures)"
            value={siteDurationHours}
            onChange={(event) =>
              setSiteDurationHours(Number(event.target.value) || 1)
            }
            required
          />
          <input
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
            placeholder="Slug (optionnel)"
            value={siteSlug}
            onChange={(event) => setSiteSlug(event.target.value)}
          />
          <div className="space-y-1 md:col-span-3">
            <input
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              type="file"
              accept="image/*"
              onChange={(event) => void handleSitePhotoChange(event)}
            />
            {sitePhotoName ? (
              <p className="text-xs text-zinc-500">{sitePhotoName}</p>
            ) : null}
          </div>
          {sitePhotoUrl ? (
            <div className="relative h-40 w-full overflow-hidden rounded-lg md:col-span-3">
              <Image
                src={sitePhotoUrl}
                alt="Prévisualisation tourisme"
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          ) : null}
          <textarea
            className="rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15 md:col-span-3"
            placeholder="Description"
            value={siteDescription}
            onChange={(event) => setSiteDescription(event.target.value)}
            rows={3}
            required
          />
          <div className="md:col-span-3">
            <button className="rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background">
              {editingSiteId
                ? 'Enregistrer les modifications'
                : 'Ajouter activité tourisme'}
            </button>
            {editingSiteId ? (
              <button
                type="button"
                onClick={resetTourismForm}
                className="ml-2 rounded-lg border border-black/10 px-3 py-2 text-sm font-medium dark:border-white/15"
              >
                Annuler
              </button>
            ) : null}
          </div>
        </form>

        <div className="space-y-2">
          {sites.map((site) => {
            const meta = parseTourismMeta(site.description);
            const adminCategory = mapApiCategoryToAdmin(site.categorieTourisme);
            const imageMedia = site.medias?.find(
              (media) => media.type === 'IMAGE',
            );

            return (
              <article
                key={site.id}
                className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
              >
                {imageMedia ? (
                  <div className="relative mb-2 h-40 w-full overflow-hidden rounded-lg">
                    <Image
                      src={imageMedia.url}
                      alt={site.nom}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <p className="font-medium">{site.nom}</p>
                <p>{categoryTourismLabel[adminCategory]}</p>
                <p>📍 {site.region}</p>
                <p>{meta.durationHours}h</p>
                <p>
                  {new Intl.NumberFormat('fr-FR').format(meta.priceXof)} XOF
                </p>
                <p>{meta.summary}</p>
                <p>Statut: {site.isActive ? 'Actif' : 'Inactif'}</p>
                <div className="mt-2 space-y-2 rounded-md border border-black/10 p-2 dark:border-white/15">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Guide principal
                  </p>
                  <div className="flex gap-2">
                    <select
                      value={selectedGuideBySite[site.id] ?? ''}
                      onChange={(event) =>
                        setSelectedGuideBySite((previous) => ({
                          ...previous,
                          [site.id]: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/15"
                    >
                      <option value="">Sélectionner un guide principal</option>
                      {guides.map((guide) => (
                        <option key={guide.id} value={guide.id}>
                          {guide.nom} ({guide.email})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => void affiliateGuideToSite(site.id)}
                      type="button"
                      className="rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/15"
                    >
                      Affecter
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(siteGuides[site.id] ?? []).length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        Aucun guide principal
                      </p>
                    ) : (
                      (siteGuides[site.id] ?? []).map((guide) => (
                        <div
                          key={guide.id}
                          className="flex items-center justify-between rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/15"
                        >
                          <span>
                            {guide.nom} • {guide.email}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void removeGuideAffiliation(site.id, guide.id)
                            }
                            className="rounded border border-black/10 px-2 py-0.5 dark:border-white/15"
                          >
                            Retirer
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => startEditSite(site)}
                    className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => void toggleSiteActive(site)}
                    className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
                  >
                    {site.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                  <button
                    onClick={() => void deleteSite(site.id)}
                    className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
