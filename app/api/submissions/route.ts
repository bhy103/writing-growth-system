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

const sourceTypeByUploadMethod = {
  photo: "PHOTO",
  image: "IMAGE_UPLOAD",
  document: "DOCUMENT_UPLOAD",
} as const;

type UploadMetadata = {
  extractionConfidence: number | null;
  extractedText: string;
  file?: File;
  fileName: string;
  fileSize: number | null;
  fileType: string;
  method: keyof typeof sourceTypeByUploadMethod;
};

function parseUploadMetadata(body: Record<string, unknown>): UploadMetadata | null {
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
    extractionConfidence,
    extractedText,
    fileName,
    fileSize,
    fileType: fileType || "unknown",
    method: method as keyof typeof sourceTypeByUploadMethod,
  };
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function parseSubmissionRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;
    const method = getFormValue(formData, "uploadMethod");
    const extractionConfidenceValue = getFormValue(formData, "extractionConfidence");
    const extractionConfidence = extractionConfidenceValue ? Number(extractionConfidenceValue) : null;

    return {
      content: getFormValue(formData, "content"),
      submissionId: getFormValue(formData, "submissionId"),
      title: getFormValue(formData, "title"),
      upload:
        file && method in sourceTypeByUploadMethod
          ? {
              extractionConfidence:
                typeof extractionConfidence === "number" && Number.isFinite(extractionConfidence)
                  ? extractionConfidence
                  : null,
              extractedText: getFormValue(formData, "extractedText"),
              file,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type || "unknown",
              method: method as keyof typeof sourceTypeByUploadMethod,
            }
          : null,
    };
  }

  const body = await request.json().catch(() => null);
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  return {
    content: typeof record.content === "string" ? record.content.trim() : "",
    submissionId: typeof record.submissionId === "string" ? record.submissionId : "",
    title: typeof record.title === "string" ? record.title.trim() : "",
    upload: parseUploadMetadata(record),
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
    const { content, submissionId, title, upload } = await parseSubmissionRequest(request);

    if (!title || (!content && !upload)) {
      return NextResponse.json(
        { message: "Please add a title and English draft, or upload a source file." },
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

    const storagePath = upload
      ? isObjectStorageConfigured()
        ? buildStoredUploadPath({ fileName: upload.fileName, studentId: student.id })
        : buildPendingStoragePath({ fileName: upload.fileName, studentId: student.id })
      : "";
    const storedUpload = upload?.file
      ? await uploadFileToConfiguredStorage({
          file: upload.file,
          storagePath,
        })
      : null;

    const submission = ownedSubmission
      ? await prisma.writingSubmission.update({
          where: {
            id: ownedSubmission.id,
          },
          data: {
            title,
            content: content || null,
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
            content: content || null,
            sourceType: upload ? sourceTypeByUploadMethod[upload.method] : "TYPED_TEXT",
            status: "DRAFT",
            uploads: upload
              ? {
                  create: {
                    fileName: upload.fileName,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    storagePath: storedUpload?.storagePath ?? storagePath,
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
