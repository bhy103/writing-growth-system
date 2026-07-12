-- AlterTable
ALTER TABLE "AccountProfile" ADD COLUMN     "parentFamilyName" TEXT,
ADD COLUMN     "parentFirstName" TEXT,
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "familyName" TEXT,
ADD COLUMN     "firstName" TEXT;
