# TourismChain CI

Plateforme digitale pour centraliser le tourisme ivoirien, sécuriser l'expérience via blockchain, valoriser les acteurs culturels et générer des données décisionnelles.

## Phase 0 — Vision Produit

### Objectifs

- Centraliser l'offre touristique ivoirienne (sites, circuits, événements, artisanat)
- Sécuriser les interactions sensibles (tickets, certifications, traçabilité) via blockchain
- Valoriser les acteurs locaux (guides, artisans, organisateurs)
- Produire des indicateurs exploitables pour les décideurs publics/privés

### Acteurs

- Touriste
- Guide touristique
- Artisan
- Organisateur d'événement
- Administrateur

## Phase 1 — User Stories Complètes

### Touriste

- En tant que touriste, je peux créer un compte pour accéder aux services personnalisés.
- En tant que touriste, je peux découvrir des sites touristiques par région et catégorie.
- En tant que touriste, je peux réserver une visite avec un guide certifié.
- En tant que touriste, je peux acheter un billet pour un événement culturel.
- En tant que touriste, je peux scanner un QR code blockchain pour vérifier l'authenticité d'un billet.
- En tant que touriste, je peux noter et commenter mon expérience.
- En tant que touriste, je peux consulter mes souvenirs digitaux (NFT/certificats).

### Guide touristique

- En tant que guide, je peux créer un profil professionnel certifié.
- En tant que guide, je peux proposer des circuits avec prix, durée et capacité.
- En tant que guide, je peux gérer mes disponibilités.
- En tant que guide, je peux recevoir et traiter les réservations.
- En tant que guide, je peux être noté par les touristes pour renforcer ma crédibilité.

### Artisan

- En tant qu'artisan, je peux publier mes produits culturels.
- En tant qu'artisan, je peux vendre des souvenirs aux touristes.
- En tant qu'artisan, je peux associer une preuve d'authenticité blockchain à mes produits.
- En tant qu'artisan, je peux suivre mes ventes et performances.

### Organisateur d'événement

- En tant qu'organisateur, je peux créer un événement (lieu, date, capacité, prix).
- En tant qu'organisateur, je peux vendre des billets en ligne.
- En tant qu'organisateur, je peux contrôler l'accès via QR code.
- En tant qu'organisateur, je peux consulter les statistiques de fréquentation.

### Administrateur

- En tant qu'administrateur, je peux valider les comptes des acteurs.
- En tant qu'administrateur, je peux certifier les guides et artisans.
- En tant qu'administrateur, je peux modérer les contenus publiés.
- En tant qu'administrateur, je peux suivre des analytics nationaux du tourisme.

## Phase 2 — Architecture

- Frontend: Next.js (App Router)
- Backend: API Routes (Node.js)
- Base de données: PostgreSQL via Prisma
- Blockchain: Smart contract + preuve de transaction
- Storage média: Cloudinary
- Authentification: JWT / NextAuth
- Analytics: Dashboard décisionnel

## Phase 3 — Modules Système

- Authentification
- Profils acteurs
- Tourism Explorer
- Réservations
- Marketplace artisanale
- Gestion événements
- Certification blockchain
- Data analytics

## Phase 4 — Modélisation BDD

Le modèle de données V1 est défini dans `prisma/schema.prisma` avec les entités clés:

- `User`
- `TouristSite`
- `Booking`
- `Event`
- `ArtisanProduct`
- `Review`
- `BlockchainTicket`

## Phase 5 — Setup Projet

Le projet est déjà initialisé avec la stack de base:

- Next.js
- Prisma + PostgreSQL client
- Zustand
- Axios
- NextAuth
- Ant Design

### Démarrage local

1. Installer les dépendances

```bash
npm install
```

1. Configurer la base PostgreSQL dans `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

### Configuration blockchain (optionnelle)

Pour activer l’ancrage on-chain (EVM), ajoutez aussi dans `.env`:

```bash
BLOCKCHAIN_RPC_URL="https://votre-rpc-evm"
BLOCKCHAIN_PRIVATE_KEY="0x..."
BLOCKCHAIN_EXPLORER_BASE_URL="https://sepolia.etherscan.io"
```

- Si ces variables sont absentes, l’application reste fonctionnelle en mode fallback `OFFCHAIN`.
- Les preuves restent enregistrées et vérifiables via les endpoints blockchain internes.

1. Créer la migration initiale:

```bash
npx prisma migrate dev --name init_tourismchain
```

1. Lancer l'application:

```bash
npm run dev
```

## Prochaine étape recommandée

Implémenter les API Routes par module dans cet ordre:

1. Authentification & rôles
2. Explorer des sites
3. Réservations guides
4. Événements & billetterie QR
5. Marketplace artisanale
6. Reviews & analytics
