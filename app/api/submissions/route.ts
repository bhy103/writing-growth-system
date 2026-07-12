import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

const sourceTypeByUploadMethod = {
  photo: "PHOTO",
  image: "IMAGE_UPLOAD",
  document: "DOCUMENT_UPLOAD",
} as const;

function sanitizeStorageName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "uploaded-writing";
}

function parseUploadMetadata(body: Record<string, unknown>) {
  if (!body.upload || typeof body.upload !== "object") {
    return null;
  }

  const upload = body.upload as Record<string, unknown>;
  const method = typeof upload.method === "string" ? upload.method : "";
  const fileName = typeof upload.fileName === "string" ? upload.fileName.trim() : "";
  const fileType = typeof upload.fileType === "string" ? upload.fileType.trim() : "";
  const fileSize = typeof upload.fileSize === "number" && Number.isFinite(upload.fileSize) ? Math.round(upload.fileSize) : null;
  const extractionConfidence =
    typeof upload.extractionConfidence === "number" && Number.isFinite(upload.extractionConfidence)
      ? upload.extractionConfidence
      : null;
  const extractedText = typeof upload.extractedText === "string" ? upload.extractedText.trim() : "";

  if (!fileName || !(method in sourceTypeByUploadMethod)) {
    return null;
  }

  return {
    method: method as keyof typeof sourceTypeByUploadMethod,
    fileName,
    fileType: fileType || "unknown",
    fileSize,
    extractionConfidence,
    extractedText,
  };
}

export async function GET() {
  try {
    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const submissions = await prisma.writingSubmission.findMany({
      where: {
        studentId: student.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: {
        id: true,
        title: true,
        status: true,
        analysis: {
          select: {
            focusDimension: true,
          },
        },
      },
    });

    return NextResponse.json({
      submissions: submissions.map((submission) => ({
        id: submission.id,
        title: submission.title,
        status: submission.status,
        focus: submission.analysis?.focusDimension ?? "Not analyzed",
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";
    const upload = body && typeof body === "object" ? parseUploadMetadata(body as Record<string, unknown>) : null;

    if (!title || !content) {
      return NextResponse.json(
        { message: "Please add a title and English draft before saving." },
        { status: 400 },
      );
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const ownedSubmission = submissionId
      ? await prisma.writingSubmission.findFirst({
          where: {
            id: submissionId,
            studentId: student.id,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (submissionId && !ownedSubmission) {
      return NextResponse.json({ message: "This writing submission does not belong to the current student." }, { status: 403 });
    }

    const submission = ownedSubmission
      ? await prisma.writingSubmission.update({
          where: {
            id: ownedSubmission.id,
          },
          data: {
            title,
            content,
            status: "DRAFT",
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        })
      : await prisma.writingSubmission.create({
          data: {
            studentId: student.id,
            title,
            content,
            sourceType: upload ? sourceTypeByUploadMethod[upload.method] : "TYPED_TEXT",
            status: "DRAFT",
            uploads: upload
              ? {
                  create: {
                    fileName: upload.fileName,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    storagePath: `pending-storage/${student.id}/${Date.now()}-${sanitizeStorageName(upload.fileName)}`,
                    extractionConfidence: upload.extractionConfidence,
                    extractedText: upload.extractedText || content,
                  },
                }
              : undefined,
          },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        });

    return NextResponse.json({ submission });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
