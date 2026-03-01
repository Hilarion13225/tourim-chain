import Link from 'next/link';
import Image from 'next/image';
import HomeMarketSections from '@/app/_components/home-market-sections';
import HomeChatbot from '@/app/_components/home-chatbot';
import { prisma } from '@/lib/prisma';

function formatCompact(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function parseTourismMeta(description: string) {
  if (!description.startsWith('__TOURISM_META__')) {
    return {
      summary: description,
      priceXof: null as number | null,
    };
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
    };

    return {
      summary,
      priceXof: Number(parsed.priceXof ?? 0),
    };
  } catch {
    return {
      summary,
      priceXof: null as number | null,
    };
  }
}

function tourismCategoryLabel(category: string) {
  switch (category) {
    case 'CULTURE':
      return 'Culture & Histoire';
    case 'NATURE':
      return 'Nature & Safari';
    case 'BEACH':
      return 'Plage & Détente';
    case 'HERITAGE':
      return 'Patrimoine';
    case 'RELIGIOUS':
      return 'Spiritualité';
    case 'ADVENTURE':
      return 'Aventure';
    default:
      return 'Découverte locale';
  }
}

function fallbackImageForCategory(category: string) {
  switch (category) {
    case 'CULTURE':
    case 'HERITAGE':
    case 'RELIGIOUS':
      return '/envies/culturel.svg';
    case 'NATURE':
    case 'ADVENTURE':
      return '/envies/ecologique.svg';
    case 'BEACH':
      return '/envies/balneaire.svg';
    default:
      return '/envies/sportif.svg';
  }
}

export default async function Home() {
  const [
    topSites,
    latestReviews,
    totalVerifiedUsers,
    totalBookings,
    totalArtisanProducts,
    totalRestaurantDishes,
    totalPublishedEvents,
    totalUpcomingSportEvents,
  ] = await Promise.all([
    prisma.touristSite.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        nom: true,
        region: true,
        description: true,
        categorieTourisme: true,
        medias: {
          take: 1,
          where: { type: 'IMAGE' },
          select: { url: true },
        },
        reviews: {
          select: { note: true },
          take: 30,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.review.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        note: true,
        commentaire: true,
        author: {
          select: { nom: true },
        },
      },
    }),
    prisma.user.count({ where: { verified: true } }),
    prisma.booking.count(),
    prisma.artisanProduct.count(),
    prisma.restaurantDish.count(),
    prisma.event.count(),
    prisma.event.count({ where: { startAt: { gte: new Date() } } }),
  ]);

  const allRecentNotes = latestReviews.map((review) => review.note);
  const averageReviewScore =
    allRecentNotes.length > 0
      ? allRecentNotes.reduce((sum, note) => sum + note, 0) /
        allRecentNotes.length
      : 0;

  const satisfactionRate = Math.min(
    100,
    Math.max(0, (averageReviewScore / 10) * 100),
  );

  const totalOffers =
    topSites.length +
    totalPublishedEvents +
    totalArtisanProducts +
    totalRestaurantDishes;

  const destinations = topSites.map((site) => {
    const meta = parseTourismMeta(site.description);
    const avgRating =
      site.reviews.length > 0
        ? site.reviews.reduce((sum, review) => sum + review.note, 0) /
          site.reviews.length
        : 0;

    return {
      name: site.nom,
      region: `${site.region}, Côte d’Ivoire`,
      rating: avgRating > 0 ? avgRating.toFixed(1) : 'N/A',
      type: tourismCategoryLabel(site.categorieTourisme),
      price:
        meta.priceXof && meta.priceXof > 0
          ? `À partir de ${new Intl.NumberFormat('fr-FR').format(meta.priceXof)} FCFA`
          : 'Tarif à consulter',
      ambiance: meta.summary || 'Découverte locale',
      image:
        site.medias[0]?.url || fallbackImageForCategory(site.categorieTourisme),
      href: `/tourisme/${site.id}`,
    };
  });

  const experiences = [
    {
      title: 'Tourisme local',
      description: `${formatCompact(topSites.length)} destination(s) touristique(s) active(s).`,
      icon: '🧭',
    },
    {
      title: 'Réservations',
      description: `${formatCompact(totalBookings)} réservation(s) enregistrée(s) sur la plateforme.`,
      icon: '📅',
    },
    {
      title: 'Article & artisanat',
      description: `${formatCompact(totalArtisanProducts)} article(s) souvenir référencé(s).`,
      icon: '🎨',
    },
    {
      title: 'Restauration & sport',
      description: `${formatCompact(totalRestaurantDishes)} plat(s) + ${formatCompact(totalUpcomingSportEvents)} événement(s) sportif(s) à venir.`,
      icon: '🏟️',
    },
  ];

  const reviews = latestReviews.map((review) => ({
    id: review.id,
    author: review.author.nom,
    text: review.commentaire,
    score: `${review.note.toFixed(1)}`,
  }));

  const prioritesTouriste = [
    {
      title: 'Confiance',
      text: 'Avis vérifiés, photos réelles, prix transparents et conditions d’annulation claires.',
    },
    {
      title: 'Simplicité',
      text: 'Réservation rapide en 3 clics avec confirmation immédiate.',
    },
    {
      title: 'Sécurité',
      text: 'Informations fiables, guides certifiés et assistance en cas de besoin.',
    },
    {
      title: 'Mobilité',
      text: 'Trajets optimisés, estimation des coûts et options de transport pratiques.',
    },
    {
      title: 'Expérience locale',
      text: 'Circuits culturels, gastronomie, festivals et artisanat authentique.',
    },
    {
      title: 'Accompagnement',
      text: 'Parcours FR/EN, itinéraires prêts à l’emploi et support rapide.',
    },
  ];

  const leviersConversion = [
    'Packs tout compris (hébergement + transport + activités)',
    'Programme de fidélité avec récompenses',
    'Offres saisonnières sur les destinations phares',
  ];

  const etapes = [
    {
      step: 1,
      icon: '👥',
      title: 'Inscrivez-vous',
      description:
        'Créez votre compte gratuitement. Client ou prestataire, rejoignez la communauté.',
    },
    {
      step: 2,
      icon: '🔎',
      title: 'Explorez',
      description: 'Parcourez les offres par destination, catégorie et budget.',
    },
    {
      step: 3,
      icon: '✅',
      title: 'Réservez',
      description:
        'Choisissez le service qui vous convient et confirmez en toute sécurité.',
    },
    {
      step: 4,
      icon: '⭐',
      title: 'Évaluez',
      description:
        'Partagez votre avis pour aider la communauté à faire les meilleurs choix.',
    },
  ];

  const envies = [
    {
      title: 'Balnéaire',
      subtitle: 'Plages & détente',
      tag: `${formatCompact(
        topSites.filter((site) => site.categorieTourisme === 'BEACH').length,
      )} site(s)`,
      image: '/envies/balneaire.svg',
      href: '/tourisme',
      colSpan: 'md:col-span-2',
    },
    {
      title: 'Culturel',
      subtitle: 'Histoire & arts',
      tag: `${formatCompact(
        topSites.filter((site) =>
          ['CULTURE', 'HERITAGE', 'RELIGIOUS'].includes(
            site.categorieTourisme,
          ),
        ).length,
      )} site(s)`,
      image: '/envies/culturel.svg',
      href: '/tourisme',
      colSpan: 'md:col-span-2',
    },
    {
      title: 'Sportif',
      subtitle: 'Aventure & énergie',
      tag: `${formatCompact(totalUpcomingSportEvents)} événement(s)`,
      image: '/envies/sportif.svg',
      href: '/sport',
      colSpan: 'md:col-span-1',
    },
    {
      title: 'Écologique',
      subtitle: 'Nature & forêts',
      tag: 'Taï National Park',
      image: '/envies/ecologique.svg',
      href: '/tourisme',
      colSpan: 'md:col-span-1',
    },
    {
      title: 'Gastronomie',
      subtitle: 'Saveurs ivoiriennes',
      tag: `${formatCompact(totalRestaurantDishes)} plat(s)`,
      image: '/envies/gastronomie.svg',
      href: '/restauration',
      colSpan: 'md:col-span-2',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-7xl space-y-16 px-6 py-10 lg:px-10">
        <section className="relative -mx-6 overflow-hidden rounded-none border-y border-black/10 bg-zinc-900 text-white md:rounded-b-3xl lg:-mx-10 dark:border-white/15">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.45),transparent_38%),radial-gradient(circle_at_80%_75%,rgba(34,197,94,0.35),transparent_36%),linear-gradient(110deg,#111827_0%,#1f2937_45%,#334155_100%)]" />
          <div className="absolute inset-0 bg-black/45" />

          <div className="relative mx-auto flex min-h-[640px] w-full max-w-7xl flex-col items-center justify-center px-6 py-20 text-center lg:px-10">
            <p className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <span className="mr-2 h-2 w-2 rounded-full bg-orange-400" />
              Explorez la Côte d’Ivoire depuis Abidjan
            </p>

            <h1 className="mt-8 max-w-5xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
              Votre passerelle vers
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-yellow-300 to-green-400 bg-clip-text text-transparent">
                le tourisme ivoirien
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-xl text-zinc-200">
              Découvrez des expériences locales fiables : transport,
              hébergement, événements et gastronomie, partout en Côte d’Ivoire.
            </p>

            <div className="mt-10 grid w-full max-w-5xl gap-3 rounded-3xl bg-white p-3 text-zinc-700 shadow-2xl md:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
              <input
                className="h-14 rounded-2xl border border-zinc-200 px-4 text-base outline-none"
                placeholder="Destination"
              />
              <input
                className="h-14 rounded-2xl border border-zinc-200 px-4 text-base outline-none"
                placeholder="jj/mm/aaaa"
              />
              <input
                className="h-14 rounded-2xl border border-zinc-200 px-4 text-base outline-none"
                placeholder="Voyageurs"
              />
              <Link
                href="/tourisme"
                className="flex h-14 items-center justify-center rounded-2xl bg-orange-500 px-6 text-lg font-semibold text-white hover:bg-orange-600"
              >
                Rechercher un séjour
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              value: formatCompact(totalVerifiedUsers),
              label: 'Acteurs touristiques actifs',
            },
            {
              value: `${Math.round(satisfactionRate)}%`,
              label: 'Satisfaction voyageur (avis récents)',
            },
            {
              value: formatCompact(totalBookings),
              label: 'Réservations enregistrées',
            },
            {
              value: formatCompact(totalOffers),
              label: 'Offres locales disponibles',
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="rounded-2xl border border-black/10 bg-white/70 p-5 dark:border-white/15 dark:bg-white/5"
            >
              <p className="text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                {stat.label}
              </p>
            </article>
          ))}
        </section>

        <section className="space-y-8 rounded-3xl border border-[#eadfcc] bg-[#f4efe6] p-6 md:p-10 dark:border-white/15 dark:bg-zinc-900/60">
          <header className="space-y-2 text-center">
            <h2 className="text-4xl font-extrabold uppercase tracking-wide text-zinc-900 dark:text-white md:text-5xl">
              Comment ça marche ?
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-300">
              UNEVIE simplifie la préparation de vos séjours en quelques étapes.
            </p>
          </header>

          <div className="grid gap-8 border-t border-[#e7dcc8] pt-8 md:grid-cols-4 dark:border-white/15">
            {etapes.map((item) => (
              <article key={item.step} className="space-y-4 text-center">
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-white text-3xl shadow-sm dark:border-white/15 dark:bg-zinc-800">
                  <span>{item.icon}</span>
                  <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-zinc-900 dark:text-white md:text-4xl">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <header className="space-y-1 text-center">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              Explorez par <span className="text-orange-500">Envies</span>
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Choisissez votre prochaine aventure en Côte d’Ivoire.
            </p>
          </header>

          <div className="grid gap-4 md:grid-cols-4">
            {envies.map((envie, index) => (
              <Link
                key={envie.title}
                href={envie.href}
                className={`${envie.colSpan} group relative overflow-hidden rounded-2xl border border-black/10 shadow-sm dark:border-white/15 ${
                  index < 2 ? 'min-h-[230px]' : 'min-h-[200px]'
                }`}
              >
                <Image
                  src={envie.image}
                  alt={envie.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

                <div className="relative flex h-full flex-col justify-between p-4 text-white">
                  <span className="w-fit rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium backdrop-blur">
                    {envie.tag}
                  </span>

                  <div>
                    <h3 className="text-4xl font-extrabold leading-none md:text-3xl">
                      {envie.title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-orange-200">
                      {envie.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="destinations" className="space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Destinations tendance</h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Sélection inspirée des voyageurs et guides locaux
              </p>
            </div>
            <Link
              href="/#explorer"
              className="text-sm font-medium hover:opacity-70"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {destinations.length === 0 ? (
              <article className="md:col-span-2 xl:col-span-4 rounded-2xl border border-black/10 bg-background p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                Aucune destination publiée pour le moment.
              </article>
            ) : (
              destinations.map((destination) => (
                <Link
                  key={destination.name}
                  href={destination.href}
                  className="space-y-3 rounded-2xl border border-black/10 bg-background p-4 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-white/15"
                >
                  <div className="relative h-36 overflow-hidden rounded-xl">
                    <Image
                      src={destination.image}
                      alt={destination.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{destination.name}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {destination.region}
                    </p>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {destination.ambiance}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">
                      {destination.type}
                    </span>
                    <span className="font-medium">⭐ {destination.rating}</span>
                  </div>
                  <p className="text-sm font-medium">{destination.price}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section id="experiences" className="space-y-6">
          <h2 className="text-2xl font-semibold">
            Expériences à forte valeur locale
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {experiences.map((experience) => (
              <article
                key={experience.title}
                className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/15 dark:bg-zinc-900"
              >
                <p className="text-2xl">{experience.icon}</p>
                <h3 className="mt-4 font-semibold">{experience.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {experience.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <HomeMarketSections />

        <section id="reviews" className="space-y-5">
          <h2 className="text-2xl font-semibold">
            Ce que disent les voyageurs
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.length === 0 ? (
              <article className="md:col-span-3 rounded-2xl border border-black/10 p-5 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                Aucun avis publié pour le moment.
              </article>
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-black/10 p-5 dark:border-white/15"
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    “{review.text}”
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-medium">{review.author}</span>
                    <span>⭐ {review.score}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-black/10 bg-zinc-50 p-6 dark:border-white/15 dark:bg-zinc-900 md:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">
              Ce qui fait aimer la Côte d’Ivoire aux touristes
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Les éléments à renforcer pour transformer une visite en vraie
              expérience mémorable.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {prioritesTouriste.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-black/10 bg-background p-4 dark:border-white/15"
              >
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-black/10 bg-background p-5 dark:border-white/15">
            <h3 className="font-semibold">Leviers qui convertissent vite</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              {leviersConversion.map((levier) => (
                <li key={levier}>• {levier}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-3xl bg-foreground px-6 py-10 text-background md:px-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-semibold">
                Prêt à lancer tourisme Ci ?
              </h2>
              <p className="mt-2 text-sm text-zinc-300">
                Activez votre vitrine touristique, vos réservations et vos
                tickets sécurisés en un seul espace.
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-full bg-background px-5 py-3 text-sm font-semibold text-foreground"
            >
              Commencer maintenant
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 py-8 text-center text-sm text-zinc-500 dark:border-white/15 dark:text-zinc-400">
        tourisme Ci • Plateforme du tourisme en Côte d’Ivoire
      </footer>

      <HomeChatbot />
    </div>
  );
}
