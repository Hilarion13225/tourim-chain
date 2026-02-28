'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Tourisme', href: '/tourisme' },
  { label: 'Reservation', href: '/reservation' },
  { label: 'Article', href: '/article' },
  { label: 'Restauration', href: '/restauration' },
  { label: 'sport', href: '/sport' },
];

export default function MainNavTabs() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 text-lg font-semibold text-zinc-700 dark:text-zinc-200 md:flex">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              isActive
                ? 'rounded-lg bg-orange-100 px-3 py-1.5 text-orange-600 dark:bg-orange-500/20 dark:text-orange-300'
                : 'rounded-lg px-3 py-1.5 hover:text-orange-500'
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
