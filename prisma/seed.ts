/**
 * Script de seed — TourismChain CI
 * Remplit la base avec des données factices réalistes sur le tourisme
 * en Côte d'Ivoire : sites, guides, artisans, hébergements, restaurants,
 * locations de véhicules, événements, circuits, avis...
 *
 * Lancement :
 *   npx tsx prisma/seed.ts
 *
 * Tous les comptes créés utilisent le mot de passe : Test1234!
 * (à ne garder qu'en environnement de développement)
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../app/generated/prisma/client';
import {
  UserRole,
  UserStatus,
  TourismCategory,
  CircuitStatus,
  EventStatus,
  ProductStatus,
} from '../app/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL manquant dans .env');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'Test1234!';

async function hashed() {
  return bcrypt.hash(DEFAULT_PASSWORD, 10);
}

async function main() {
  console.log('🌍 Démarrage du seed TourismChain CI...');
  const passwordHash = await hashed();

  // ---------------------------------------------------------------------
  // 1. SITES TOURISTIQUES
  // ---------------------------------------------------------------------
  const sitesData = [
    {
      slug: 'basilique-notre-dame-de-la-paix',
      nom: 'Basilique Notre-Dame de la Paix',
      region: 'Lacs',
      description:
        "Plus grande basilique du monde par sa superficie, construite à Yamoussoukro dans les années 1980. Chef-d'œuvre architectural inspiré de Saint-Pierre de Rome.",
      categorieTourisme: TourismCategory.RELIGIOUS,
      latitude: 6.8156,
      longitude: -5.2894,
    },
    {
      slug: 'parc-national-de-tai',
      nom: 'Parc National de Taï',
      region: 'Nawa',
      description:
        "Classé au patrimoine mondial de l'UNESCO, dernier grand vestige de forêt tropicale primaire d'Afrique de l'Ouest. Abrite chimpanzés, hippopotames pygmées et éléphants de forêt.",
      categorieTourisme: TourismCategory.NATURE,
      latitude: 5.8500,
      longitude: -7.3500,
    },
    {
      slug: 'parc-national-de-la-comoe',
      nom: 'Parc National de la Comoé',
      region: 'Zanzan',
      description:
        "Un des plus grands parcs d'Afrique de l'Ouest, réserve de biosphère UNESCO. Savanes, forêts-galeries et une faune riche : éléphants, buffles, lions, antilopes.",
      categorieTourisme: TourismCategory.NATURE,
      latitude: 9.1000,
      longitude: -3.7500,
    },
    {
      slug: 'grand-bassam-quartier-colonial',
      nom: 'Grand-Bassam — Quartier Colonial',
      region: 'Sud-Comoé',
      description:
        "Ancienne capitale coloniale, inscrite au patrimoine mondial de l'UNESCO. Architecture coloniale française, musée du costume et longue plage bordée de cocotiers.",
      categorieTourisme: TourismCategory.HERITAGE,
      latitude: 5.2044,
      longitude: -3.7381,
    },
    {
      slug: 'plage-assinie',
      nom: 'Plage d\'Assinie-Mafia',
      region: 'Sud-Comoé',
      description:
        "Station balnéaire prisée avec lagune et océan Atlantique séparés par une bande de sable. Sports nautiques, restaurants de bord de mer et ambiance festive.",
      categorieTourisme: TourismCategory.BEACH,
      latitude: 5.1333,
      longitude: -3.2833,
    },
    {
      slug: 'cascades-de-man',
      nom: 'Cascades de Man',
      region: 'Tonkpi',
      description:
        "Nichées dans les montagnes de l'Ouest ivoirien, ces cascades offrent un cadre naturel spectaculaire, idéal pour la randonnée dans la 'ville des 18 montagnes'.",
      categorieTourisme: TourismCategory.ADVENTURE,
      latitude: 7.4125,
      longitude: -7.5539,
    },
    {
      slug: 'village-tisserands-korhogo',
      nom: 'Village des Tisserands de Korhogo',
      region: 'Poro',
      description:
        "Village sénoufo réputé pour le tissage traditionnel du pagne 'faso dan fani' et la sculpture sur bois. Immersion dans l'artisanat du Nord ivoirien.",
      categorieTourisme: TourismCategory.CULTURE,
      latitude: 9.4580,
      longitude: -5.6296,
    },
    {
      slug: 'musee-des-civilisations-abidjan',
      nom: 'Musée des Civilisations de Côte d\'Ivoire',
      region: 'Abidjan',
      description:
        "Situé au Plateau, ce musée présente masques, statues et objets traditionnels retraçant l'histoire des différentes ethnies de Côte d'Ivoire.",
      categorieTourisme: TourismCategory.CULTURE,
      latitude: 5.3226,
      longitude: -4.0225,
    },
    {
      slug: 'mont-nimba',
      nom: 'Réserve du Mont Nimba',
      region: 'Nzérékoré-Frontière',
      description:
        "Réserve naturelle intégrale à cheval sur la Côte d'Ivoire, la Guinée et le Liberia, classée UNESCO. Point culminant du pays et biodiversité exceptionnelle.",
      categorieTourisme: TourismCategory.NATURE,
      latitude: 7.6000,
      longitude: -8.4167,
    },
    {
      slug: 'cathedrale-saint-paul-abidjan',
      nom: 'Cathédrale Saint-Paul d\'Abidjan',
      region: 'Abidjan',
      description:
        "Cathédrale au design futuriste surplombant la lagune Ébrié, inaugurée en 1985. Vitraux modernes et vue panoramique sur Abidjan.",
      categorieTourisme: TourismCategory.RELIGIOUS,
      latitude: 5.3167,
      longitude: -4.0208,
    },
  ];

  const sites = [];
  for (const s of sitesData) {
    const site = await prisma.touristSite.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    sites.push(site);
  }
  console.log(`✅ ${sites.length} sites touristiques créés`);

  // ---------------------------------------------------------------------
  // 2. UTILISATEURS PAR RÔLE
  // ---------------------------------------------------------------------
  async function upsertUser(data: {
    nom: string;
    email: string;
    phone: string;
    role: UserRole;
  }) {
    return prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        ...data,
        passwordHash,
        pays: "Côte d'Ivoire",
        status: UserStatus.ACTIVE,
        verified: true,
      },
    });
  }

  // Guides
  const guideKoffi = await upsertUser({
    nom: 'Koffi N\'Guessan',
    email: 'koffi.guide@tourismchain.ci',
    phone: '+225 07 01 02 03 04',
    role: UserRole.GUIDE,
  });
  const guideAminata = await upsertUser({
    nom: 'Aminata Coulibaly',
    email: 'aminata.guide@tourismchain.ci',
    phone: '+225 05 11 22 33 44',
    role: UserRole.GUIDE,
  });
  const guideYao = await upsertUser({
    nom: 'Yao Brou',
    email: 'yao.guide@tourismchain.ci',
    phone: '+225 01 55 66 77 88',
    role: UserRole.GUIDE,
  });

  await prisma.guideProfile.upsert({
    where: { userId: guideKoffi.id },
    update: {},
    create: {
      userId: guideKoffi.id,
      bio: "Guide certifié depuis 8 ans, spécialiste des parcs nationaux et de la faune ivoirienne.",
      region: 'Zanzan',
      yearsExperience: 8,
      hourlyRate: 15000,
      spokenLanguages: ['Français', 'Anglais', 'Dioula'],
      licenseNumber: 'CI-GUIDE-2018-0042',
      isCertified: true,
      averageRating: 4.8,
      totalReviews: 34,
    },
  });
  await prisma.guideProfile.upsert({
    where: { userId: guideAminata.id },
    update: {},
    create: {
      userId: guideAminata.id,
      bio: "Passionnée d'histoire et de patrimoine, spécialiste de Grand-Bassam et du Plateau d'Abidjan.",
      region: 'Sud-Comoé',
      yearsExperience: 5,
      hourlyRate: 12000,
      spokenLanguages: ['Français', 'Anglais'],
      licenseNumber: 'CI-GUIDE-2020-0117',
      isCertified: true,
      averageRating: 4.6,
      totalReviews: 21,
    },
  });
  await prisma.guideProfile.upsert({
    where: { userId: guideYao.id },
    update: {},
    create: {
      userId: guideYao.id,
      bio: "Guide montagne dans l'Ouest ivoirien, spécialiste de randonnée et des cascades de Man.",
      region: 'Tonkpi',
      yearsExperience: 3,
      hourlyRate: 10000,
      spokenLanguages: ['Français', 'Yacouba'],
      licenseNumber: 'CI-GUIDE-2022-0289',
      isCertified: false,
      averageRating: 4.3,
      totalReviews: 9,
    },
  });

  // Artisans
  const artisanFatou = await upsertUser({
    nom: 'Fatou Ouattara',
    email: 'fatou.artisan@tourismchain.ci',
    phone: '+225 07 22 33 44 55',
    role: UserRole.ARTISAN,
  });
  const artisanKouame = await upsertUser({
    nom: 'Kouamé Assemien',
    email: 'kouame.artisan@tourismchain.ci',
    phone: '+225 05 66 77 88 99',
    role: UserRole.ARTISAN,
  });

  await prisma.artisanProfile.upsert({
    where: { userId: artisanFatou.id },
    update: {},
    create: {
      userId: artisanFatou.id,
      bio: 'Tisserande traditionnelle de pagnes Faso Dan Fani, formée par sa grand-mère à Korhogo.',
      workshopName: 'Atelier Fatou Tissage',
      speciality: 'Textile traditionnel sénoufo',
      region: 'Poro',
      isCertified: true,
      averageRating: 4.9,
      totalReviews: 27,
    },
  });
  await prisma.artisanProfile.upsert({
    where: { userId: artisanKouame.id },
    update: {},
    create: {
      userId: artisanKouame.id,
      bio: 'Sculpteur sur bois, spécialiste des masques et statues baoulé.',
      workshopName: 'Atelier Assemien Sculpture',
      speciality: 'Sculpture sur bois',
      region: 'Gbêkê',
      isCertified: true,
      averageRating: 4.7,
      totalReviews: 15,
    },
  });

  // Organisateur
  const organisateur = await upsertUser({
    nom: 'Ivoire Events SARL',
    email: 'contact@ivoireevents.ci',
    phone: '+225 27 22 44 55 66',
    role: UserRole.ORGANIZER,
  });
  await prisma.organizerProfile.upsert({
    where: { userId: organisateur.id },
    update: {},
    create: {
      userId: organisateur.id,
      organizationName: 'Ivoire Events SARL',
      website: 'https://ivoireevents.ci',
      region: 'Abidjan',
    },
  });

  // Hébergement
  const hebergeur = await upsertUser({
    nom: 'Résidence Baobab',
    email: 'contact@residencebaobab.ci',
    phone: '+225 27 21 35 40 12',
    role: UserRole.ACCOMMODATION_COMPANY,
  });
  const hebergeur2 = await upsertUser({
    nom: 'Lagune Hôtel Assinie',
    email: 'reservation@lagunehotel.ci',
    phone: '+225 27 21 50 60 70',
    role: UserRole.ACCOMMODATION_COMPANY,
  });

  // Location de véhicules
  const loueur = await upsertUser({
    nom: 'CI Auto Location',
    email: 'contact@ciautolocation.ci',
    phone: '+225 27 22 30 40 50',
    role: UserRole.VEHICLE_RENTAL_COMPANY,
  });

  // Restaurants
  const restaurant1 = await upsertUser({
    nom: 'Maquis Chez Tantie Marie',
    email: 'contact@tantiemarie.ci',
    phone: '+225 07 88 99 00 11',
    role: UserRole.RESTAURANT,
  });
  const restaurant2 = await upsertUser({
    nom: 'Restaurant La Lagune Bleue',
    email: 'contact@lagunebleue.ci',
    phone: '+225 27 21 40 50 60',
    role: UserRole.RESTAURANT,
  });

  // Touristes
  const touriste1 = await upsertUser({
    nom: 'Jean Dupont',
    email: 'jean.dupont@example.com',
    phone: '+33 6 12 34 56 78',
    role: UserRole.TOURIST,
  });
  const touriste2 = await upsertUser({
    nom: 'Awa Diabaté',
    email: 'awa.diabate@example.com',
    phone: '+225 05 77 88 99 00',
    role: UserRole.TOURIST,
  });
  const touriste3 = await upsertUser({
    nom: 'Marco Rossi',
    email: 'marco.rossi@example.com',
    phone: '+39 340 123 4567',
    role: UserRole.TOURIST,
  });

  for (const t of [touriste1, touriste2, touriste3]) {
    await prisma.touristProfile.upsert({
      where: { userId: t.id },
      update: {},
      create: { userId: t.id, preferredLang: 'Français' },
    });
  }

  console.log('✅ Utilisateurs et profils créés (mot de passe pour tous : Test1234!)');

  // ---------------------------------------------------------------------
  // 3. CIRCUITS + ÉTAPES
  // ---------------------------------------------------------------------
  const circuit1 = await prisma.circuit.create({
    data: {
      guideId: guideKoffi.id,
      titre: 'Safari Comoé — 3 jours',
      description:
        "Découverte de la savane et de la faune du Parc National de la Comoé, avec nuitées en campement.",
      region: 'Zanzan',
      prix: 145000,
      dureeMinutes: 4320,
      maxParticipants: 8,
      status: CircuitStatus.PUBLISHED,
      stops: {
        create: [{ siteId: sites[2].id, ordre: 1, stayMinutes: 4000 }],
      },
    },
  });

  const circuit2 = await prisma.circuit.create({
    data: {
      guideId: guideAminata.id,
      titre: 'Grand-Bassam Patrimoine & Plage',
      description:
        "Visite guidée du quartier colonial classé UNESCO, du musée du costume, suivie d'une après-midi détente sur la plage.",
      region: 'Sud-Comoé',
      prix: 25000,
      dureeMinutes: 360,
      maxParticipants: 12,
      status: CircuitStatus.PUBLISHED,
      stops: {
        create: [{ siteId: sites[3].id, ordre: 1, stayMinutes: 240 }],
      },
    },
  });

  const circuit3 = await prisma.circuit.create({
    data: {
      guideId: guideYao.id,
      titre: 'Randonnée Cascades de Man',
      description:
        "Randonnée d'une journée dans la région des 18 montagnes jusqu'aux cascades, avec pause pique-nique.",
      region: 'Tonkpi',
      prix: 18000,
      dureeMinutes: 480,
      maxParticipants: 10,
      status: CircuitStatus.PUBLISHED,
      stops: {
        create: [{ siteId: sites[5].id, ordre: 1, stayMinutes: 300 }],
      },
    },
  });

  console.log('✅ 3 circuits créés');

  // ---------------------------------------------------------------------
  // 4. HÉBERGEMENTS
  // ---------------------------------------------------------------------
  await prisma.accommodationListing.createMany({
    data: [
      {
        ownerId: hebergeur.id,
        nom: 'Résidence Baobab — Cocody',
        description: 'Résidence meublée haut de gamme au cœur de Cocody, proche des ambassades.',
        ville: 'Abidjan',
        region: 'Abidjan',
        type: 'Appartement',
        note: 8.7,
        petitDejeuner: true,
        prixParNuit: 45000,
        capacite: 3,
      },
      {
        ownerId: hebergeur.id,
        nom: 'Résidence Baobab — Plateau',
        description: 'Studio moderne au Plateau, idéal pour les voyages professionnels.',
        ville: 'Abidjan',
        region: 'Abidjan',
        type: 'Studio',
        note: 8.2,
        petitDejeuner: false,
        prixParNuit: 30000,
        capacite: 2,
      },
      {
        ownerId: hebergeur2.id,
        nom: 'Lagune Hôtel Assinie',
        description: 'Hôtel les pieds dans le sable à Assinie, vue lagune et océan.',
        ville: 'Assinie',
        region: 'Sud-Comoé',
        type: 'Hôtel',
        note: 9.1,
        petitDejeuner: true,
        prixParNuit: 65000,
        capacite: 2,
      },
    ],
  });
  console.log('✅ 3 hébergements créés');

  // ---------------------------------------------------------------------
  // 5. LOCATION DE VÉHICULES
  // ---------------------------------------------------------------------
  await prisma.vehicleRentalListing.createMany({
    data: [
      {
        ownerId: loueur.id,
        nom: 'Toyota Land Cruiser 4x4',
        description: 'Idéal pour les excursions dans les parcs nationaux, avec chauffeur en option.',
        ville: 'Abidjan',
        type: '4x4',
        transmission: 'Manuelle',
        prixParJour: 55000,
        climatisation: true,
      },
      {
        ownerId: loueur.id,
        nom: 'Hyundai Accent',
        description: 'Berline économique parfaite pour la ville et les trajets courts.',
        ville: 'Abidjan',
        type: 'Berline',
        transmission: 'Automatique',
        prixParJour: 22000,
        climatisation: true,
      },
      {
        ownerId: loueur.id,
        nom: 'Minibus 15 places',
        description: 'Pour les groupes et excursions organisées avec chauffeur.',
        ville: 'Yamoussoukro',
        type: 'Minibus',
        transmission: 'Manuelle',
        prixParJour: 75000,
        climatisation: true,
      },
    ],
  });
  console.log('✅ 3 véhicules créés');

  // ---------------------------------------------------------------------
  // 6. PLATS RESTAURANTS
  // ---------------------------------------------------------------------
  const dishes = await prisma.$transaction([
    prisma.restaurantDish.create({
      data: {
        restaurantId: restaurant1.id,
        nom: 'Attiéké poisson braisé',
        description: 'Attiéké traditionnel accompagné de poisson braisé et sa sauce piquante.',
        cuisine: 'Ivoirienne',
        ville: 'Abidjan',
        prix: 3500,
        spicyLevel: 3,
        livraison: true,
        stock: 40,
      },
    }),
    prisma.restaurantDish.create({
      data: {
        restaurantId: restaurant1.id,
        nom: 'Kedjenou de poulet',
        description: 'Poulet mijoté aux légumes et épices, cuisson lente à l\'étouffée.',
        cuisine: 'Ivoirienne',
        ville: 'Abidjan',
        prix: 4500,
        spicyLevel: 2,
        livraison: true,
        stock: 25,
      },
    }),
    prisma.restaurantDish.create({
      data: {
        restaurantId: restaurant2.id,
        nom: 'Capitaine grillé sauce yassa',
        description: 'Filet de capitaine grillé, sauce yassa aux oignons, servi avec riz.',
        cuisine: 'Ivoirienne',
        ville: 'Assinie',
        prix: 6000,
        spicyLevel: 1,
        livraison: false,
        stock: 15,
      },
    }),
  ]);
  console.log('✅ 3 plats créés');

  // ---------------------------------------------------------------------
  // 7. PRODUITS ARTISANAUX
  // ---------------------------------------------------------------------
  const product1 = await prisma.artisanProduct.create({
    data: {
      artisanId: artisanFatou.id,
      nom: 'Pagne Faso Dan Fani — Motif traditionnel',
      description:
        'Pagne tissé main selon la technique traditionnelle sénoufo, 100% coton local.',
      categorie: 'Textile',
      regionOrigine: 'Poro',
      prix: 28000,
      stock: 12,
      status: ProductStatus.ACTIVE,
    },
  });
  const product2 = await prisma.artisanProduct.create({
    data: {
      artisanId: artisanKouame.id,
      nom: 'Masque Baoulé sculpté',
      description: 'Masque cérémoniel sculpté à la main dans du bois d\'iroko.',
      categorie: 'Sculpture',
      regionOrigine: 'Gbêkê',
      prix: 45000,
      stock: 5,
      status: ProductStatus.ACTIVE,
    },
  });
  console.log('✅ 2 produits artisanaux créés');

  // ---------------------------------------------------------------------
  // 8. ÉVÉNEMENT + BILLETTERIE
  // ---------------------------------------------------------------------
  const event = await prisma.event.create({
    data: {
      organisateurId: organisateur.id,
      nom: 'Festival des Masques et des Arts de Man 2026',
      description:
        "Grand rassemblement culturel célébrant les danses traditionnelles, masques sacrés et arts de l'Ouest ivoirien.",
      lieu: 'Place de la Paix, Man',
      region: 'Tonkpi',
      startAt: new Date('2026-11-14T09:00:00Z'),
      endAt: new Date('2026-11-16T22:00:00Z'),
      capacity: 3000,
      status: EventStatus.PUBLISHED,
      ticketTypes: {
        create: [
          { nom: 'Pass 1 jour', prix: 5000, quantityTotal: 1500 },
          { nom: 'Pass 3 jours', prix: 12000, quantityTotal: 800 },
          { nom: 'VIP', prix: 30000, quantityTotal: 100 },
        ],
      },
    },
  });
  console.log('✅ 1 événement créé avec 3 types de billets');

  // ---------------------------------------------------------------------
  // 9. RÉSERVATIONS + AVIS (pour donner vie aux dashboards)
  // ---------------------------------------------------------------------
  const booking1 = await prisma.booking.create({
    data: {
      touristId: touriste1.id,
      guideId: guideKoffi.id,
      circuitId: circuit1.id,
      date: new Date('2026-08-20T08:00:00Z'),
      participants: 2,
      totalAmount: 290000,
      statut: 'CONFIRMED',
      paymentStatus: 'PAID',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      touristId: touriste2.id,
      guideId: guideAminata.id,
      circuitId: circuit2.id,
      date: new Date('2026-08-10T09:00:00Z'),
      participants: 1,
      totalAmount: 25000,
      statut: 'COMPLETED',
      paymentStatus: 'PAID',
    },
  });

  await prisma.review.create({
    data: {
      authorId: touriste2.id,
      bookingId: booking2.id,
      guideId: guideAminata.id,
      siteId: sites[3].id,
      note: 5,
      commentaire:
        "Visite passionnante ! Aminata connaît vraiment bien l'histoire de Grand-Bassam, je recommande vivement.",
    },
  });

  await prisma.review.create({
    data: {
      authorId: touriste3.id,
      siteId: sites[0].id,
      note: 5,
      commentaire: 'Un monument impressionnant, à voir absolument en visitant Yamoussoukro.',
    },
  });

  await prisma.review.create({
    data: {
      authorId: touriste1.id,
      productId: product1.id,
      note: 4,
      commentaire: 'Très beau pagne, qualité artisanale au rendez-vous. Livraison un peu longue.',
    },
  });

  await prisma.favoriteSite.createMany({
    data: [
      { touristId: touriste1.id, siteId: sites[1].id },
      { touristId: touriste1.id, siteId: sites[4].id },
      { touristId: touriste2.id, siteId: sites[3].id },
      { touristId: touriste3.id, siteId: sites[0].id },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Réservations, avis et favoris créés');

  console.log('\n🎉 Seed terminé avec succès !');
  console.log(`   → ${sitesData.length} sites touristiques`);
  console.log('   → 3 guides, 2 artisans, 1 organisateur, 2 hébergeurs, 1 loueur, 2 restaurants, 3 touristes');
  console.log('   → 3 circuits, 3 hébergements, 3 véhicules, 3 plats, 2 produits, 1 événement');
  console.log(`\n🔑 Tous les comptes utilisent le mot de passe : ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
