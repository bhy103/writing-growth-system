import { NextResponse } from "next/server";
import { generateVocabularyStudyPack } from "@/lib/ai/vocabulary-generation";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

function parseWords(input: string) {
  const seen = new Set<string>();

  return input
    .split(/[\n,;]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => {
      const key = word.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 40);
}

function formatPackNumber(value: number) {
  return String(value).padStart(3, "0");
}

function createDefaultTitle(sequenceNumber: number) {
  return `Vocabulary Study ${formatPackNumber(sequenceNumber)}`;
}

export async function GET() {
  try {
    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const totalSets = await prisma.vocabularySet.count({
      where: {
        studentId: student.id,
      },
    });
    const sets = await prisma.vocabularySet.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: {
        id: true,
        title: true,
        sourceWords: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      sets: sets.map((set, index) => ({
        id: set.id,
        archiveNumber: totalSets - index,
        title: set.title,
        words: Array.isArray(set.sourceWords) ? set.sourceWords : [],
        createdAt: set.createdAt,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const rawWords = typeof record.words === "string" ? record.words : "";
    const words = parseWords(rawWords);

    if (words.length === 0) {
      return NextResponse.json({ message: "Please enter at least one vocabulary word." }, { status: 400 });
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const existingSetCount = await prisma.vocabularySet.count({
      where: {
        studentId: student.id,
      },
    });
    const archiveNumber = existingSetCount + 1;
    const requestedTitle = typeof record.title === "string" ? record.title.trim() : "";
    const title = requestedTitle || createDefaultTitle(archiveNumber);
    const generated = await generateVocabularyStudyPack({
      gradeLevel: student.gradeLevel,
      title,
      words,
    });
    const pack = generated.pack;

    const vocabularySet = await prisma.vocabularySet.create({
      data: {
        studentId: student.id,
        title: requestedTitle ? pack.title || title : title,
        sourceWords: words,
        vocabularySection: pack.vocabularySection,
        worksheet: pack.worksheet,
        answerKey: pack.answerKey,
        provider: generated.provider,
      },
      select: {
        id: true,
        title: true,
        sourceWords: true,
        vocabularySection: true,
        worksheet: true,
        answerKey: true,
        provider: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      set: {
        ...vocabularySet,
        archiveNumber,
        words: vocabularySet.sourceWords,
      },
      pack,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
