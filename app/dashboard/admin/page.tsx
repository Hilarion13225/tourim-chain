import DashboardSummaryClient from '@/app/dashboard/_components/dashboard-summary-client';
import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import DashboardRoleHero from '@/app/dashboard/_components/dashboard-role-hero';

export default async function AdminDashboardPage() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  return (
    <>
      <DashboardRoleHero
        title="Dashboard Admin"
        subtitle="Supervisez la plateforme nationale, les validations et les performances multi-acteurs."
        actions={[
          {
            label: 'Valider acteurs',
            href: '/dashboard/admin/validation-acteurs',
          },
          {
            label: 'Analytics nationaux',
            href: '/dashboard/admin/analytics-nationaux',
          },
        ]}
        stats={[
          { label: 'Acteurs en attente', value: '23' },
          { label: 'Transactions du mois', value: '3 450' },
          { label: 'Disponibilité', value: '99.9%' },
        ]}
      />
      <DashboardSummaryClient role="ADMIN" userId={sessionUser.userId} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/dashboard/admin/validation-acteurs"
          className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Validation acteurs
        </Link>
        <Link
          href="/dashboard/admin/analytics-nationaux"
          className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Analytics nationaux
        </Link>
        <Link
          href="/dashboard/admin/alertes-urgence"
          className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Alertes urgence
        </Link>
        <Link
          href="/dashboard/admin/reservations"
          className="rounded-2xl border border-black/10 bg-white p-4 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200"
        >
          Réservations
        </Link>
      </section>
    </>
  );
}
