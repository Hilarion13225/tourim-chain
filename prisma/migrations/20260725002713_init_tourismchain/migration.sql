-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'ACCOMMODATION_COMPANY';
ALTER TYPE "UserRole" ADD VALUE 'VEHICLE_RENTAL_COMPANY';
ALTER TYPE "UserRole" ADD VALUE 'RESTAURANT';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "photoUrl" TEXT;

-- CreateTable
CREATE TABLE "AccommodationListing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "photoUrl" TEXT,
    "description" TEXT,
    "ville" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" DECIMAL(3,1) NOT NULL DEFAULT 8.0,
    "petitDejeuner" BOOLEAN NOT NULL DEFAULT false,
    "prixParNuit" DECIMAL(10,2) NOT NULL,
    "capacite" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccommodationListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleRentalListing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "photoUrl" TEXT,
    "description" TEXT,
    "ville" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "prixParJour" DECIMAL(10,2) NOT NULL,
    "climatisation" BOOLEAN NOT NULL DEFAULT false,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleRentalListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantDish" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "cuisine" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "spicyLevel" INTEGER NOT NULL DEFAULT 1,
    "livraison" BOOLEAN NOT NULL DEFAULT false,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantDish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantOrder" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "touristId" TEXT NOT NULL,
    "dishId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyAlert" (
    "id" TEXT NOT NULL,
    "touristId" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "locationAccuracyM" INTEGER,
    "contactPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "amount" DECIMAL(12,2),
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccommodationListing_ownerId_idx" ON "AccommodationListing"("ownerId");

-- CreateIndex
CREATE INDEX "AccommodationListing_region_idx" ON "AccommodationListing"("region");

-- CreateIndex
CREATE INDEX "AccommodationListing_isActive_idx" ON "AccommodationListing"("isActive");

-- CreateIndex
CREATE INDEX "VehicleRentalListing_ownerId_idx" ON "VehicleRentalListing"("ownerId");

-- CreateIndex
CREATE INDEX "VehicleRentalListing_ville_idx" ON "VehicleRentalListing"("ville");

-- CreateIndex
CREATE INDEX "VehicleRentalListing_disponible_idx" ON "VehicleRentalListing"("disponible");

-- CreateIndex
CREATE INDEX "RestaurantDish_restaurantId_idx" ON "RestaurantDish"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantDish_ville_idx" ON "RestaurantDish"("ville");

-- CreateIndex
CREATE INDEX "RestaurantDish_disponible_idx" ON "RestaurantDish"("disponible");

-- CreateIndex
CREATE INDEX "RestaurantOrder_restaurantId_idx" ON "RestaurantOrder"("restaurantId");

-- CreateIndex
CREATE INDEX "RestaurantOrder_touristId_idx" ON "RestaurantOrder"("touristId");

-- CreateIndex
CREATE INDEX "RestaurantOrder_dishId_idx" ON "RestaurantOrder"("dishId");

-- CreateIndex
CREATE INDEX "EmergencyAlert_touristId_idx" ON "EmergencyAlert"("touristId");

-- CreateIndex
CREATE INDEX "EmergencyAlert_status_idx" ON "EmergencyAlert"("status");

-- CreateIndex
CREATE INDEX "EmergencyAlert_createdAt_idx" ON "EmergencyAlert"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_module_idx" ON "AnalyticsEvent"("module");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- AddForeignKey
ALTER TABLE "AccommodationListing" ADD CONSTRAINT "AccommodationListing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleRentalListing" ADD CONSTRAINT "VehicleRentalListing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantDish" ADD CONSTRAINT "RestaurantDish_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_touristId_fkey" FOREIGN KEY ("touristId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantOrder" ADD CONSTRAINT "RestaurantOrder_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "RestaurantDish"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyAlert" ADD CONSTRAINT "EmergencyAlert_touristId_fkey" FOREIGN KEY ("touristId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
