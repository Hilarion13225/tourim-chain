export type MockSite = {
  id: string;
  nom: string;
  region: string;
  description: string;
  categorieTourisme: string;
};

export type MockEventTicketType = {
  id: string;
  nom: string;
  prix: string;
  quantityTotal: number;
  quantitySold: number;
};

export type MockEvent = {
  id: string;
  nom: string;
  lieu: string;
  region: string;
  startAt: string;
  ticketTypes: MockEventTicketType[];
};

export type MockProduct = {
  id: string;
  nom: string;
  description?: string;
  region?: string;
  culture?: string;
  prix: string;
  status: string;
  certificatBlockchain: string | null;
  artisan: {
    nom: string;
  };
};

export const mockSites: MockSite[] = [
  {
    id: 'site-1',
    nom: 'Grand-Bassam Patrimoine',
    region: 'Sud-Comoé',
    description:
      'Ville historique classée, architecture coloniale, plages et immersion culturelle.',
    categorieTourisme: 'CULTUREL',
  },
  {
    id: 'site-2',
    nom: 'Assinie Plage Premium',
    region: 'Lagunes',
    description:
      'Destination balnéaire incontournable pour détente, resorts et sports nautiques.',
    categorieTourisme: 'BALNEAIRE',
  },
  {
    id: 'site-3',
    nom: 'Parc National de Taï',
    region: 'Bas-Sassandra',
    description:
      'Forêt primaire UNESCO, biodiversité exceptionnelle et écotourisme durable.',
    categorieTourisme: 'ECOTOURISME',
  },
  {
    id: 'site-4',
    nom: 'Abidjan Discovery',
    region: 'Abidjan',
    description:
      'Tourisme urbain, nightlife, gastronomie, business et événements majeurs.',
    categorieTourisme: 'URBAIN_EVENT',
  },
];

export const mockEvents: MockEvent[] = [
  {
    id: 'event-1',
    nom: 'MASA - Marché des Arts du Spectacle Africain',
    lieu: 'Palais de la Culture',
    region: 'Abidjan',
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    ticketTypes: [
      {
        id: 'ticket-1',
        nom: 'Standard',
        prix: '15000',
        quantityTotal: 500,
        quantitySold: 180,
      },
    ],
  },
  {
    id: 'event-2',
    nom: 'FEMUA - Festival des Musiques Urbaines d’Anoumabo',
    lieu: 'Anoumabo',
    region: 'Abidjan',
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    ticketTypes: [
      {
        id: 'ticket-2',
        nom: 'Pass journée',
        prix: '10000',
        quantityTotal: 1200,
        quantitySold: 640,
      },
    ],
  },
  {
    id: 'event-3',
    nom: 'Nuit Culturelle de Grand-Bassam',
    lieu: 'Quartier France',
    region: 'Sud-Comoé',
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
    ticketTypes: [
      {
        id: 'ticket-3',
        nom: 'Entrée',
        prix: '8000',
        quantityTotal: 350,
        quantitySold: 90,
      },
    ],
  },
];

export const mockProducts: MockProduct[] = [
  {
    id: 'prod-1',
    nom: 'Masque Dan sculpté main',
    description:
      'Le masque Dan accompagne les rites communautaires et symbolise le lien entre art, spiritualité et transmission.',
    region: 'Montagnes',
    culture: 'Dan',
    prix: '45000',
    status: 'AVAILABLE',
    certificatBlockchain: 'CERT-DAN-001',
    artisan: { nom: 'Atelier Yacouba' },
  },
  {
    id: 'prod-2',
    nom: 'Pagnes tissés baoulé',
    prix: '28000',
    status: 'AVAILABLE',
    certificatBlockchain: null,
    artisan: { nom: 'Coopérative N’Zi' },
  },
  {
    id: 'prod-3',
    nom: 'Sculpture bois Ébène',
    prix: '62000',
    status: 'LIMITED',
    certificatBlockchain: 'CERT-EBE-008',
    artisan: { nom: 'Maison Koffi Art' },
  },
];

export function filterMockSites(params: {
  query?: string;
  region?: string;
  categorie?: string;
}) {
  const query = params.query?.trim().toLowerCase() ?? '';
  const region = params.region?.trim().toLowerCase() ?? '';
  const categorie = params.categorie?.trim().toUpperCase() ?? '';

  return mockSites.filter((site) => {
    const matchesQuery =
      !query || `${site.nom} ${site.description}`.toLowerCase().includes(query);
    const matchesRegion = !region || site.region.toLowerCase().includes(region);
    const matchesCategorie =
      !categorie || site.categorieTourisme.includes(categorie);

    return matchesQuery && matchesRegion && matchesCategorie;
  });
}
