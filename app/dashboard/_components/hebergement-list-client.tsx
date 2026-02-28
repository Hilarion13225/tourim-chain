'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

type AccommodationItem = {
	id: string;
	nom: string;
	photoUrl?: string | null;
	ville: string;
	region: string;
	type: string;
	note: string;
	petitDejeuner: boolean;
	prixParNuit: string;
	capacite: number;
	isActive: boolean;
};

function toMoney(value: string) {
	const amount = Number(value);

	if (Number.isNaN(amount)) {
		return value;
	}

	return new Intl.NumberFormat('fr-FR').format(amount);
}

type HebergementListClientProps = {
	userId: string;
};

export default function HebergementListClient({
	userId,
}: HebergementListClientProps) {
	const [items, setItems] = useState<AccommodationItem[]>([]);
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const controller = new AbortController();

		fetch('/api/accommodations', { signal: controller.signal })
			.then(async (response) => {
				const data = (await response.json()) as AccommodationItem[] | { error?: string };

				if (!response.ok) {
					setError((data as { error?: string }).error ?? 'Erreur chargement hébergements');
					setItems([]);
					return;
				}

				setError('');
				setItems(data as AccommodationItem[]);
			})
			.catch((fetchError: unknown) => {
				if (
					fetchError &&
					typeof fetchError === 'object' &&
					'name' in fetchError &&
					(fetchError as { name: string }).name === 'AbortError'
				) {
					return;
				}

				setError('Erreur chargement hébergements');
				setItems([]);
			})
			.finally(() => {
				setLoading(false);
			});

		return () => {
			controller.abort();
		};
	}, [userId]);

	return (
		<section className="space-y-4 rounded-2xl border border-black/10 p-5 dark:border-white/15">
			<h2 className="text-lg font-semibold">Mes hébergements</h2>

			{loading ? <p className="text-sm text-zinc-500">Chargement…</p> : null}
			{error ? <p className="text-sm text-red-600">{error}</p> : null}

			{!loading && !error && items.length === 0 ? (
				<p className="text-sm text-zinc-500">Aucun hébergement trouvé.</p>
			) : null}

			<div className="space-y-2">
				{items.map((item) => (
					<article
						key={item.id}
						className="rounded-lg border border-black/10 p-3 text-sm dark:border-white/15"
					>
						{item.photoUrl ? (
							<div className="relative mb-2 h-36 w-full overflow-hidden rounded-lg">
								<Image
									src={item.photoUrl}
									alt={item.nom}
									fill
									unoptimized
									sizes="(max-width: 768px) 100vw, 50vw"
									className="object-cover"
								/>
							</div>
						) : null}
						<p className="font-medium">{item.nom}</p>
						<p>{item.type}</p>
						<p>📍 {item.ville}</p>
						<p>
							Note {item.note}/10 •{' '}
							{item.petitDejeuner ? 'Petit déjeuner inclus' : 'Sans petit déjeuner'}
						</p>
						<p>{toMoney(item.prixParNuit)} XOF / nuit</p>
						<p>Capacité: {item.capacite}</p>
						<p>Statut: {item.isActive ? 'Actif' : 'Inactif'}</p>
					</article>
				))}
			</div>
		</section>
	);
}
