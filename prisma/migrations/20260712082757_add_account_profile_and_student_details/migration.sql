-- DropIndex
DROP INDEX "StudentProfile_userId_key";

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "schoolName" TEXT;

-- CreateTable
CREATE TABLE "AccountProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentBirthday" TIMESTAMP(3),
    "address" TEXT,
    "languagePreference" TEXT NOT NULL DEFAULT 'zh-CN',
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountProfile_userId_key" ON "AccountProfile"("userId");

-- AddForeignKey
ALTER TABLE "AccountProfile" ADD CONSTRAINT "AccountProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
