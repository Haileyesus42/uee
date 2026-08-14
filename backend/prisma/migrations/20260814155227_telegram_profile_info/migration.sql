-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarFileId" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthdayDay" INTEGER,
ADD COLUMN     "birthdayMonth" INTEGER,
ADD COLUMN     "birthdayYear" INTEGER,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "languageCode" TEXT;
