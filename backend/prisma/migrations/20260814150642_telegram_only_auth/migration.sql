/*
  Warnings:

  - Made the column `telegramId` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegramUsername" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "telegramId" SET NOT NULL;
