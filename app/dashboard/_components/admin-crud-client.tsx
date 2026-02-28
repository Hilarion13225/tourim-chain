'use client';

import { useEffect, useState } from 'react';

type UserItem = {
  id: string;
  nom: string;
  email: string;
  role: string;
  status: string;
  verified: boolean;
};

export default function AdminCrudClient() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUsers() {
    const response = await fetch('/api/users');
    const data = (await response.json()) as UserItem[] | { error?: string };

    if (!response.ok) {
      setError((data as { error?: string }).error ?? 'Erreur chargement users');
      return;
    }

    setUsers(data as UserItem[]);
  }

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/users', { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as UserItem[] | { error?: string };

        if (!response.ok) {
          setError(
            (data as { error?: string }).error ?? 'Erreur chargement users',
          );
          return;
        }

        setUsers(data as UserItem[]);
      })
      .catch((error: unknown) => {
        if (
          error &&
          typeof error === 'object' &&
          'name' in error &&
          (error as { name: string }).name === 'AbortError'
        ) {
          return;
        }

        setError('Erreur chargement users');
      });

    return () => {
      controller.abort();
    };
  }, []);

  async function toggleVerification(user: UserItem) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !user.verified }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Mise à jour impossible');
      return;
    }

    setMessage('Vérification mise à jour');
    await loadUsers();
  }

  async function suspendUser(user: UserItem) {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SUSPENDED' }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suspension impossible');
      return;
    }

    setMessage('Utilisateur suspendu');
    await loadUsers();
  }

  async function deleteUser(id: string) {
    const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? 'Suppression impossible');
      return;
    }

    setMessage('Utilisateur supprimé');
    await loadUsers();
  }

  return (
    <section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
      <h2 className="text-lg font-semibold">CRUD Admin — Utilisateurs</h2>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-600">{message}</p> : null}

      <div className="space-y-2">
        {users.map((user) => (
          <article
            key={user.id}
            className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
          >
            <p className="font-medium">
              {user.nom} ({user.role})
            </p>
            <p>{user.email}</p>
            <p>Statut: {user.status}</p>
            <p>Vérifié: {user.verified ? 'Oui' : 'Non'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => void toggleVerification(user)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Toggle vérification
              </button>
              <button
                onClick={() => void suspendUser(user)}
                className="rounded-md border border-black/10 px-2 py-1 dark:border-white/15"
              >
                Suspendre
              </button>
              <button
                onClick={() => void deleteUser(user.id)}
                className="rounded-md bg-zinc-900 px-2 py-1 text-white dark:bg-zinc-100 dark:text-black"
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
