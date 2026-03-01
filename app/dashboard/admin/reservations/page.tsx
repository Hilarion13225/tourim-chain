import AdminReservationsList from '@/app/dashboard/_components/admin-reservations-list';

export default function AdminReservationsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Réservations
        </h1>
        <p className="text-sm text-zinc-500">
          Vue consolidée des réservations et commandes de la plateforme.
        </p>
      </div>
      <AdminReservationsList />
    </section>
  );
}
