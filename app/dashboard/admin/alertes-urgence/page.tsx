import AdminEmergencyAlerts from '@/app/dashboard/_components/admin-emergency-alerts';

export default function AdminAlertesUrgencePage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Alertes urgence
        </h1>
        <p className="text-sm text-zinc-500">
          Consultez et suivez les alertes touristes avec localisation.
        </p>
      </div>
      <AdminEmergencyAlerts />
    </section>
  );
}
