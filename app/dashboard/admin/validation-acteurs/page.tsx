import AdminCrudClient from '@/app/dashboard/_components/admin-crud-client';

export default function AdminValidationActeursPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Validation acteurs
        </h1>
        <p className="text-sm text-zinc-500">
          Gérez les validations et opérations administratives de la plateforme.
        </p>
      </div>
      <AdminCrudClient />
    </section>
  );
}
