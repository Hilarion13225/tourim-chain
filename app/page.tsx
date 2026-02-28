import Link from 'next/link';
import Image from 'next/image';
import HomeMarketSections from '@/app/_components/home-market-sections';
import HomeChatbot from '@/app/_components/home-chatbot';

export default function Home() {
  const destinations = [
    {
      name: 'Bassam Patrimoine',
      region: 'Sud-Comoé, Côte d’Ivoire',
      rating: '4.8',
      type: 'Culture & Histoire',
      price: 'À partir de 35 000 FCFA',
      ambiance: 'Ville côtière classée UNESCO',
      image: '/envies/culturel.svg',
      href: '/#explorer',
    },
    {
      name: 'Parc de la Comoé',
      region: 'Nord-Est, Côte d’Ivoire',
      rating: '4.7',
      type: 'Nature & Safari',
      price: 'À partir de 52 000 FCFA',
      ambiance: 'Biodiversité exceptionnelle',
      image: '/envies/ecologique.svg',
      href: '/#explorer',
    },
    {
      name: 'Assinie Évasion',
      region: 'Lagunes, Côte d’Ivoire',
      rating: '4.9',
      type: 'Plage & Détente',
      price: 'À partir de 48 000 FCFA',
      ambiance: 'Lagune et océan en une journée',
      image: '/envies/balneaire.svg',
      href: '/#explorer',
    },
    {
      name: 'Yamoussoukro Sacré',
      region: 'District autonome',
      rating: '4.6',
      type: 'Spiritualité & Architecture',
      price: 'À partir de 28 000 FCFA',
      ambiance: 'Patrimoine monumental et culturel',
      image: '/envies/sportif.svg',
      href: '/#explorer',
    },
  ];

  const experiences = [
    {
      title: 'Circuit avec guide certifié',
      description:
        'Réservez des guides vérifiés avec disponibilité en temps réel.',
      icon: '🧭',
    },
    {
      title: 'Billets événement QR',
      description:
        'Achetez, scannez et contrôlez les accès de façon sécurisée.',
      icon: '🎟️',
    },
    {
      title: 'Marketplace artisanale',
      description:
        'Commandez des créations locales avec preuve d’authenticité.',
      icon: '🎨',
    },
    {
      title: 'Souvenirs digitaux',
      description:
        'Conservez vos expériences sous forme de collectibles vérifiables.',
      icon: '🪙',
    },
  ];

  const reviews = [
    {
      author: 'Aïcha K.',
      text: 'Interface claire, réservation rapide et expérience guide exceptionnelle.',
      score: '5.0',
    },
    {
      author: 'Moussa T.',
      text: 'J’ai acheté mon billet festival en 2 minutes, scan à l’entrée parfait.',
      score: '4.9',
    },
    {
      author: 'Elena R.',
      text: 'Très bonne découverte culturelle et artisans incroyables.',
      score: '4.8',
    },
  ];

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
      tag: 'CI Assinie',
      image: '/envies/balneaire.svg',
      href: '/sejours?type=BALNEAIRE',
      colSpan: 'md:col-span-2',
    },
    {
      title: 'Culturel',
      subtitle: 'Histoire & arts',
      tag: 'CI Grand-Bassam',
      image: '/envies/culturel.svg',
      href: '/sejours?type=CULTUREL',
      colSpan: 'md:col-span-2',
    },
    {
      title: 'Sportif',
      subtitle: 'Aventure & énergie',
      tag: 'CI Abidjan',
      image: '/envies/sportif.svg',
      href: '/sejours?type=URBAIN_EVENT',
      colSpan: 'md:col-span-1',
    },
    {
      title: 'Écologique',
      subtitle: 'Nature & forêts',
      tag: 'Taï National Park',
      image: '/envies/ecologique.svg',
      href: '/sejours?type=ECOTOURISME',
      colSpan: 'md:col-span-1',
    },
    {
      title: 'Gastronomie',
      subtitle: 'Saveurs ivoiriennes',
      tag: 'CI Plateau',
      image: '/envies/gastronomie.svg',
      href: '/sejours?type=CULTUREL',
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
                href="/sejours"
                className="flex h-14 items-center justify-center rounded-2xl bg-orange-500 px-6 text-lg font-semibold text-white hover:bg-orange-600"
              >
                Rechercher un séjour
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { value: '+1 200', label: 'Acteurs touristiques actifs' },
            { value: '98%', label: 'Satisfaction voyageur' },
            { value: '24/7', label: 'Assistance réservation' },
            { value: '50+', label: 'Expériences locales disponibles' },
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
            {destinations.map((destination) => (
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
            ))}
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
            {reviews.map((review) => (
              <article
                key={review.author}
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
            ))}
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
