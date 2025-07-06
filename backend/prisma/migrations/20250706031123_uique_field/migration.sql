/*
  Warnings:

  - A unique constraint covering the columns `[organization_id]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "EntityType" ADD VALUE 'PLAN';

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_organization_id_key" ON "subscriptions"("organization_id");
