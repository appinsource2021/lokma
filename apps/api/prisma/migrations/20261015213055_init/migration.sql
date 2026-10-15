-- CreateEnum
CREATE TYPE "PromotionKind" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "FulfilmentMode" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PLACED', 'ACCEPTED', 'PREPARING', 'ON_THE_WAY', 'READY_FOR_PICKUP', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Restaurant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "cuisines" TEXT[],
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "coverHue" INTEGER NOT NULL DEFAULT 20,
    "openingHours" JSONB NOT NULL,
    "prepMinutes" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "minOrder" INTEGER NOT NULL,
    "etaMin" INTEGER NOT NULL,
    "etaMax" INTEGER NOT NULL,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "basePrice" INTEGER NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[],
    "allergens" TEXT[],
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionGroup" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minSelect" INTEGER NOT NULL DEFAULT 0,
    "maxSelect" INTEGER NOT NULL DEFAULT 1,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Option" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceDelta" INTEGER NOT NULL DEFAULT 0,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "kind" "PromotionKind" NOT NULL,
    "value" INTEGER NOT NULL,
    "minSubtotal" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "mode" "FulfilmentMode" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PLACED',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "addressLine" TEXT,
    "addressLat" DOUBLE PRECISION,
    "addressLng" DOUBLE PRECISION,
    "note" TEXT,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,
    "deliveryFee" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "promotionLabel" TEXT,
    "etaMin" INTEGER NOT NULL,
    "etaMax" INTEGER NOT NULL,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "lineTotal" INTEGER NOT NULL,
    "options" JSONB NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- CreateIndex
CREATE INDEX "DeliveryZone_restaurantId_idx" ON "DeliveryZone"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuCategory_restaurantId_idx" ON "MenuCategory"("restaurantId");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "OptionGroup_itemId_idx" ON "OptionGroup"("itemId");

-- CreateIndex
CREATE INDEX "Option_groupId_idx" ON "Option"("groupId");

-- CreateIndex
CREATE INDEX "Promotion_restaurantId_idx" ON "Promotion"("restaurantId");

-- CreateIndex
CREATE INDEX "Order_restaurantId_placedAt_idx" ON "Order"("restaurantId", "placedAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- AddForeignKey
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionGroup" ADD CONSTRAINT "OptionGroup_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Option" ADD CONSTRAINT "Option_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Promotion" ADD CONSTRAINT "Promotion_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
