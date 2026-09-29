-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('PHEASANT', 'GROUSE', 'PRAIRIE_CHICKEN', 'WATERFOWL', 'WHITETAIL', 'MULE_DEER', 'TURKEY', 'ANTELOPE');

-- CreateEnum
CREATE TYPE "Region" AS ENUM ('EAST_RIVER', 'WEST_RIVER');

-- CreateEnum
CREATE TYPE "HuntStyle" AS ENUM ('GUIDED', 'DIY', 'BOTH');

-- CreateTable
CREATE TABLE "Lodge" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSample" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "species" "Species"[],
    "region" "Region" NOT NULL,
    "huntStyle" "HuntStyle" NOT NULL,
    "wildBirds" BOOLEAN NOT NULL DEFAULT false,
    "dogsAllowed" BOOLEAN NOT NULL DEFAULT false,
    "pricePerPerson" INTEGER NOT NULL,
    "priceNotes" TEXT NOT NULL DEFAULT '',
    "packageDays" INTEGER NOT NULL,
    "town" TEXT NOT NULL,
    "county" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "maxGroupSize" INTEGER NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "lastChecked" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lodge_pkey" PRIMARY KEY ("id")
);

