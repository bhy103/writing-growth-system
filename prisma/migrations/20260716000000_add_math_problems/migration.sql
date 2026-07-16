CREATE TABLE "MathProblem" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "notes" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER,
    "storagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MathProblem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MathProblem_studentId_category_createdAt_idx" ON "MathProblem"("studentId", "category", "createdAt");
CREATE INDEX "MathProblem_studentId_createdAt_idx" ON "MathProblem"("studentId", "createdAt");

ALTER TABLE "MathProblem" ADD CONSTRAINT "MathProblem_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
