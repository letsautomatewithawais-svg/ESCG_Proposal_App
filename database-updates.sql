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

-- 2026-07-19 (2)
-- 1) ProposalVisit: one row per page load of a client-facing proposal, so
--    the admin can see each individual visit's start time + duration, not
--    just the ProposalView-wide aggregate. Powers the new "Visits" section
--    in the admin detail panel.
-- 2) Atomic increment functions, called via supabase-js .rpc(), replacing
--    the tracking API's previous select-then-update pattern for
--    totalSeconds/openCount — that read-modify-write was not atomic, so
--    concurrent tracking requests (routine: "open" firing alongside a
--    heartbeat, or overlapping section-time flushes) could race and lose
--    an increment, which is why total time under-reported vs. actual time
--    spent on the page.

-- CreateTable
CREATE TABLE "ProposalVisit" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalSeconds" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProposalVisit_proposalId_idx" ON "ProposalVisit"("proposalId");

-- AddForeignKey
ALTER TABLE "ProposalVisit" ADD CONSTRAINT "ProposalVisit_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Atomic "open" event: create-or-increment ProposalView in one statement
-- instead of select-then-insert-or-update.
CREATE OR REPLACE FUNCTION record_proposal_open(p_proposal_id UUID, p_ip TEXT, p_user_agent TEXT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ProposalView" (id, "proposalId", "firstOpenAt", "lastSeenAt", "openCount", "ipAddress", "userAgent", "updatedAt")
  VALUES (gen_random_uuid(), p_proposal_id, now(), now(), 1, p_ip, p_user_agent, now())
  ON CONFLICT ("proposalId")
  DO UPDATE SET
    "openCount" = "ProposalView"."openCount" + 1,
    "lastSeenAt" = now(),
    "updatedAt" = now();
END;
$$;

-- Atomic ProposalView.totalSeconds increment (heartbeat events). A no-op if
-- the row doesn't exist yet, matching the prior behavior.
CREATE OR REPLACE FUNCTION increment_proposal_view_seconds(p_proposal_id UUID, p_delta INTEGER)
RETURNS void LANGUAGE sql AS $$
  UPDATE "ProposalView"
  SET "totalSeconds" = "totalSeconds" + p_delta, "lastSeenAt" = now(), "updatedAt" = now()
  WHERE "proposalId" = p_proposal_id;
$$;

-- Atomic SectionView create-or-increment (sectionTime events).
CREATE OR REPLACE FUNCTION increment_section_view_seconds(p_proposal_id UUID, p_section_name TEXT, p_delta INTEGER)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "SectionView" (id, "proposalId", "sectionName", "firstViewedAt", "totalSeconds")
  VALUES (gen_random_uuid(), p_proposal_id, p_section_name, now(), p_delta)
  ON CONFLICT ("proposalId", "sectionName")
  DO UPDATE SET "totalSeconds" = "SectionView"."totalSeconds" + p_delta;
END;
$$;

-- Create a ProposalVisit row the first time its client-generated visitId is
-- seen ("open" event); a no-op on any later event referencing the same id.
CREATE OR REPLACE FUNCTION record_proposal_visit(p_visit_id UUID, p_proposal_id UUID)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "ProposalVisit" (id, "proposalId", "startedAt", "lastSeenAt", "totalSeconds")
  VALUES (p_visit_id, p_proposal_id, now(), now(), 0)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Atomic ProposalVisit.totalSeconds increment (heartbeat events).
CREATE OR REPLACE FUNCTION increment_proposal_visit_seconds(p_visit_id UUID, p_delta INTEGER)
RETURNS void LANGUAGE sql AS $$
  UPDATE "ProposalVisit"
  SET "totalSeconds" = "totalSeconds" + p_delta, "lastSeenAt" = now()
  WHERE id = p_visit_id;
$$;

---------------------------------------------------------

-- 2026-07-20
-- Scheduling detail (day of week + time-of-day session) for the client-facing
-- proposal document's "Scheduling" line, matching Tory's sales PDF template.
-- Nullable so existing proposals render with just frequencyOfService.

ALTER TABLE "Proposal" ADD COLUMN "schedulingDay" TEXT;
ALTER TABLE "Proposal" ADD COLUMN "schedulingTime" TEXT;

---------------------------------------------------------
