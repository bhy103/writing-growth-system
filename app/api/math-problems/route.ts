import { NextResponse } from "next/server";
import { classifyMathProblem } from "@/lib/ai/math-problem-classification";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import {
  buildStoredUploadPath,
  isObjectStorageConfigured,
  uploadFileToConfiguredStorage,
} from "@/lib/upload/upload-storage";

const supportedImageTypes = new Set(["image/jpeg", "image/png"]);

function getFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCategory(value: string) {
  return value.trim().replace(/\s+/g, " ").slice(0, 80) || "General";
}

function splitTextProblems(input: string) {
  return input
    .split(/\n\s*\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function createDefaultTitle(sequenceNumber: number) {
  return `Math Problem ${String(sequenceNumber).padStart(3, "0")}`;
}

function serializeProblem(problem: {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  createdAt: Date;
}) {
  return {
    ...problem,
    createdAt: problem.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const problems = await prisma.mathProblem.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 80,
      select: {
        id: true,
        title: true,
        category: true,
        notes: true,
        problemText: true,
        answerText: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      problems: problems.map(serializeProblem),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);
    const legacyFile = formData.get("file");
    const allFiles = [...files, ...(legacyFile instanceof File && legacyFile.size > 0 ? [legacyFile] : [])].slice(0, 20);
    const textProblems = splitTextProblems(getFormText(formData, "problemText"));

    if (allFiles.length === 0 && textProblems.length === 0) {
      return NextResponse.json({ message: "Please paste a math question or add at least one image." }, { status: 400 });
    }

    if (allFiles.some((file) => !supportedImageTypes.has(file.type))) {
      return NextResponse.json({ message: "Please upload JPG or PNG images for math problems." }, { status: 400 });
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const existingCount = await prisma.mathProblem.count({
      where: {
        studentId: student.id,
      },
    });
    const requestedTitle = getFormText(formData, "title");
    const requestedCategory = getFormText(formData, "category");
    const notes = getFormText(formData, "notes");

    if (allFiles.length > 0 && !isObjectStorageConfigured()) {
      return NextResponse.json(
        { message: "File storage is not configured. Please check Supabase storage variables." },
        { status: 500 },
      );
    }

    const createdProblems = [];
    let sequence = existingCount;

    for (const file of allFiles) {
      sequence += 1;
      const fallbackTitle = requestedTitle || createDefaultTitle(sequence);
      const classification = await classifyMathProblem({
        fallbackTitle,
        file,
      });
      const storagePath = buildStoredUploadPath({
        fileName: file.name,
        studentId: student.id,
      });
      await uploadFileToConfiguredStorage({
        file,
        storagePath,
      });

      const problem = await prisma.mathProblem.create({
        data: {
          studentId: student.id,
          title: requestedTitle || classification.title,
          category: normalizeCategory(requestedCategory || classification.category),
          notes: notes || null,
          problemText: classification.problemText || null,
          answerText: classification.answerText || null,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          storagePath,
        },
        select: {
          id: true,
          title: true,
          category: true,
          notes: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
      });

      createdProblems.push(problem);
    }

    for (const problemText of textProblems) {
      sequence += 1;
      const fallbackTitle = requestedTitle || createDefaultTitle(sequence);
      const classification = await classifyMathProblem({
        fallbackTitle,
        text: problemText,
      });
      const problem = await prisma.mathProblem.create({
        data: {
          studentId: student.id,
          title: requestedTitle || classification.title,
          category: normalizeCategory(requestedCategory || classification.category),
          notes: notes || null,
          problemText: classification.problemText || problemText,
          answerText: classification.answerText || null,
          fileName: null,
          fileType: null,
          fileSize: null,
          storagePath: null,
        },
        select: {
          id: true,
          title: true,
          category: true,
          notes: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          createdAt: true,
        },
      });

      createdProblems.push(problem);
    }

    return NextResponse.json({
      problem: createdProblems[0] ? serializeProblem(createdProblems[0]) : null,
      problems: createdProblems.map(serializeProblem),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
