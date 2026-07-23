/*
  Warnings:

  - The `plan` column on the `subscriptions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "subscriptions" DROP COLUMN "plan",
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'FREE';
