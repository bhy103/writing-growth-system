-- AlterTable
ALTER TABLE "AccountProfile" ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "suburb" TEXT;

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "gender" TEXT;
