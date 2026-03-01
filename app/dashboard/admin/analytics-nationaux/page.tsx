import AdminNationalAnalyticsClient from '@/app/dashboard/_components/admin-national-analytics-client';

export default function AdminAnalyticsNationauxPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Analytics nationaux
        </h1>
        <p className="text-sm text-zinc-500">
          Suivez les métriques nationales et la performance globale
          multi-acteurs.
        </p>
      </div>
      <AdminNationalAnalyticsClient />
    </section>
  );
}
