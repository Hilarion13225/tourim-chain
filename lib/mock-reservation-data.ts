export type ReservationAccommodation = {
  id: string;
  nom: string;
  ville: string;
  type: 'Hotel' | 'Appartement' | 'Villa';
  prixNuit: number;
  note: number;
  petitDej: boolean;
};

export const reservationAccommodationMocks: ReservationAccommodation[] = [
  {
    id: 'acc-1',
    nom: 'Hôtel Laguna Premium',
    ville: 'Abidjan',
    type: 'Hotel',
    prixNuit: 55000,
    note: 8.9,
    petitDej: true,
  },
  {
    id: 'acc-2',
    nom: 'Résidence Assinie Beach',
    ville: 'Assinie',
    type: 'Appartement',
    prixNuit: 42000,
    note: 8.5,
    petitDej: false,
  },
  {
    id: 'acc-3',
    nom: 'Villa Bassam Horizon',
    ville: 'Grand-Bassam',
    type: 'Villa',
    prixNuit: 78000,
    note: 9.1,
    petitDej: true,
  },
  {
    id: 'acc-4',
    nom: 'Hôtel Comoé Centre',
    ville: 'Bouaké',
    type: 'Hotel',
    prixNuit: 31000,
    note: 8.1,
    petitDej: true,
  },
];
