-- 2026-07-18
-- Initial schema (Proposal, Signature, ProposalView, SectionView)
-- Generated via: npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script
-- Run this in the Supabase SQL Editor (project ref: bgjlnetcsvfjktcvmwcx) to create the tables.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('Draft', 'Sent', 'Opened', 'Signed', 'Lost');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" UUID NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'Draft',
    "walkThroughDate" TIMESTAMP(3) NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyAddress" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "frequencyOfService" TEXT NOT NULL,
    "scopeOfWork" TEXT NOT NULL,
    "pricePerVisit" DECIMAL(10,2) NOT NULL,
    "monthlyCostExclGst" DECIMAL(10,2) NOT NULL,
    "totalMonthlyInclGst" DECIMAL(10,2) NOT NULL,
    "acquisitionMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "signatureImage" TEXT NOT NULL,
    "typedName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalView" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "firstOpenAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "openCount" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SectionView" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "sectionName" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SectionView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Signature_proposalId_key" ON "Signature"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalView_proposalId_key" ON "ProposalView"("proposalId");

-- CreateIndex
CREATE UNIQUE INDEX "SectionView_proposalId_sectionName_key" ON "SectionView"("proposalId", "sectionName");

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalView" ADD CONSTRAINT "ProposalView_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SectionView" ADD CONSTRAINT "SectionView_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

---------------------------------------------------------

-- 2026-07-19
-- Track accurate time-in-view per section, not just first-viewed timestamp
-- Generated via: npx prisma migrate diff --from-schema <prior schema.prisma> --to-schema prisma/schema.prisma --script

ALTER TABLE "SectionView" ADD COLUMN     "totalSeconds" INTEGER NOT NULL DEFAULT 0;

---------------------------------------------------------
