-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspensionReason" TEXT,
ADD COLUMN     "suspensionUntil" TIMESTAMP(3);
