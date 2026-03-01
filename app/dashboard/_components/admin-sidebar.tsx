'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SidebarItem = {
  label: string;
  href: string;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Dashboard Admin', href: '/dashboard/admin' },
  { label: 'Validation acteurs', href: '/dashboard/admin/validation-acteurs' },
  {
    label: 'Analytics nationaux',
    href: '/dashboard/admin/analytics-nationaux',
  },
  { label: 'Alertes urgence', href: '/dashboard/admin/alertes-urgence' },
  { label: 'Réservations', href: '/dashboard/admin/reservations' },
];

export default function AdminSidebar({
  email,
  role,
}: {
  email: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="space-y-1 border-b border-black/10 pb-4 dark:border-white/15">
        <p className="text-xl font-black text-zinc-900 dark:text-white">
          tourismeCi
        </p>
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          Espace connecté
        </p>
        <p className="text-sm text-zinc-500">{email}</p>
        <p className="text-xs text-zinc-500">Rôle: {role}</p>
      </div>

      <nav className="mt-4 space-y-2">
        {SIDEBAR_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard/admin' &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
