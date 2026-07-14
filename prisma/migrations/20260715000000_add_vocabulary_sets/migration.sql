CREATE TABLE "VocabularySet" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sourceWords" JSONB NOT NULL,
    "vocabularySection" TEXT NOT NULL,
    "worksheet" TEXT NOT NULL,
    "answerKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'openai',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularySet_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VocabularySet_studentId_createdAt_idx" ON "VocabularySet"("studentId", "createdAt");

ALTER TABLE "VocabularySet" ADD CONSTRAINT "VocabularySet_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
