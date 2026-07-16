import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import {
  buildPendingStoragePath,
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

function createDefaultTitle(sequenceNumber: number) {
  return `Math Problem ${String(sequenceNumber).padStart(3, "0")}`;
}

function serializeProblem(problem: {
  id: string;
  title: string;
  category: string;
  notes: string | null;
  fileName: string;
  fileType: string;
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
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Please choose a math problem image first." }, { status: 400 });
    }

    if (!supportedImageTypes.has(file.type)) {
      return NextResponse.json({ message: "Please upload a JPG or PNG image for the math problem." }, { status: 400 });
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const existingCount = await prisma.mathProblem.count({
      where: {
        studentId: student.id,
      },
    });
    const title = getFormText(formData, "title") || createDefaultTitle(existingCount + 1);
    const category = normalizeCategory(getFormText(formData, "category"));
    const notes = getFormText(formData, "notes");
    let storagePath = buildPendingStoragePath({
      fileName: file.name,
      studentId: student.id,
    });

    if (!isObjectStorageConfigured()) {
      return NextResponse.json(
        { message: "File storage is not configured. Please check Supabase storage variables." },
        { status: 500 },
      );
    }

    storagePath = buildStoredUploadPath({
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
        title: title.slice(0, 120),
        category,
        notes: notes || null,
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

    return NextResponse.json({
      problem: serializeProblem(problem),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
