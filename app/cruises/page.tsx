import ServiceTabs from '@/app/_components/service-tabs';

export default function CruisesPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-8 lg:px-10">
      <ServiceTabs />

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-900">
        <h1 className="text-3xl font-bold">Cruises</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Explorez les expériences bateau et lagunes en Côte d’Ivoire.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Port / zone"
          />
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Date"
          />
          <input
            className="h-12 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
            placeholder="Nombre de passagers"
          />
          <button className="h-12 rounded-xl bg-orange-500 px-4 text-sm font-semibold text-white hover:bg-orange-600">
            Voir les croisières
          </button>
        </div>
      </section>
    </main>
  );
}
