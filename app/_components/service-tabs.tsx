'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const services = [
  { label: 'Flights', href: '/flights', icon: '✈️' },
  { label: 'Stays', href: '/sejours', icon: '🛏️' },
  { label: 'Cars', href: '/cars', icon: '🚗' },
  { label: 'Packages', href: '/packages', icon: '🎒' },
  { label: 'Cruises', href: '/cruises', icon: '🛳️' },
];

export default function ServiceTabs() {
  const pathname = usePathname();

  return (
    <nav className="overflow-x-auto">
      <ul className="flex min-w-max items-center gap-2 rounded-2xl border border-black/10 bg-white p-2 dark:border-white/15 dark:bg-zinc-900">
        {services.map((service) => {
          const isActive = pathname === service.href;

          return (
            <li key={service.href}>
              <Link
                href={service.href}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{service.icon}</span>
                <span>{service.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
