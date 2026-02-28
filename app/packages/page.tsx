import ServiceTabs from '@/app/_components/service-tabs';

export default function PackagesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <ServiceTabs />

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-900">
        <h1 className="text-3xl font-bold">Packages</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Combinez vol + hébergement + activités dans un package optimisé.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Destination"
          />
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Date départ"
          />
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Durée du séjour"
          />
          <button className="h-12 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600">
            Voir les packages
          </button>
        </div>
      </section>
    </main>
  );
}
