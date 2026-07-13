import { NextResponse } from "next/server";
import { analyzeWritingWithAi } from "@/lib/ai/writing-analysis";
import { extractWritingFromUpload } from "@/lib/ai/writing-extraction";
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

async function createUntitledSubmissionTitle(prisma: ReturnType<typeof getPrisma>, studentId: string) {
  const untitledSubmissions = await prisma.writingSubmission.findMany({
    where: {
      studentId,
      title: {
        startsWith: "Untitled ",
      },
    },
    select: {
      title: true,
    },
  });
  const usedNumbers = untitledSubmissions
    .map((submission) => submission.title.match(/^Untitled (\d+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value));
  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

  return `Untitled ${String(nextNumber).padStart(2, "0")}`;
}

function createAnalysisData(report: Awaited<ReturnType<typeof analyzeWritingWithAi>>["report"], parentSummaryZh: string | null) {
  return {
    overallLevel: report.overall,
    focusDimension: report.focus,
    strongestDimension: report.strongest.name,
    weakestDimension: report.weakest.name,
    rubricJson: report.dimensions,
    studentFeedback: report.weakest.note,
    parentSummaryZh,
  };
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
    const parsedSubmission = await parseSubmissionRequest(request);
    let { title } = parsedSubmission;
    const { submissionId, upload } = parsedSubmission;
    let { content } = parsedSubmission;

    if (!content && !upload) {
      return NextResponse.json(
        { message: "Please add an English draft, or upload a source file." },
        { status: 400 },
      );
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const extractedWriting = !content && upload?.file ? await extractWritingFromUpload(upload.file) : null;

    if (!content && extractedWriting?.content) {
      content = extractedWriting.content;
    }

    if (!title && extractedWriting?.title) {
      title = extractedWriting.title;
    }

    if (!title && upload) {
      title = await createUntitledSubmissionTitle(prisma, student.id);
    }

    if (!title) {
      return NextResponse.json({ message: "Please add a title before saving this draft." }, { status: 400 });
    }

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

    let uploadStorageWarning = "";
    let storagePath = upload ? buildPendingStoragePath({ fileName: upload.fileName, studentId: student.id }) : "";

    if (upload && isObjectStorageConfigured()) {
      const storedStoragePath = buildStoredUploadPath({ fileName: upload.fileName, studentId: student.id });

      try {
        const storedUpload = upload.file
          ? await uploadFileToConfiguredStorage({
              file: upload.file,
              storagePath: storedStoragePath,
            })
          : null;

        storagePath = storedUpload?.storagePath ?? storedStoragePath;
      } catch (error) {
        uploadStorageWarning =
          error instanceof Error
            ? error.message
            : "The writing record was saved, but the original file could not be stored.";
      }
    }

    const analysis = upload && content
      ? await analyzeWritingWithAi({
          title,
          draft: content,
          gradeLevel: student.gradeLevel,
        })
      : null;
    const analysisData = analysis ? createAnalysisData(analysis.report, analysis.parentSummaryZh) : null;

    const submission = ownedSubmission
      ? await prisma.writingSubmission.update({
          where: {
            id: ownedSubmission.id,
          },
          data: {
            title,
            content: content || null,
            status: analysisData ? "ANALYZED" : "DRAFT",
            analysis: analysisData
              ? {
                  upsert: {
                    create: analysisData,
                    update: analysisData,
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
        })
      : await prisma.writingSubmission.create({
          data: {
            studentId: student.id,
            title,
            content: content || null,
            sourceType: upload ? sourceTypeByUploadMethod[upload.method] : "TYPED_TEXT",
            status: analysisData ? "ANALYZED" : "DRAFT",
            analysis: analysisData
              ? {
                  create: analysisData,
                }
              : undefined,
            uploads: upload
              ? {
                  create: {
                    fileName: upload.fileName,
                    fileType: upload.fileType,
                    fileSize: upload.fileSize,
                    storagePath,
                    extractionConfidence: upload.extractionConfidence,
                    extractedText: upload.extractedText || extractedWriting?.content || content,
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

    return NextResponse.json({
      extractedText: extractedWriting?.content || undefined,
      provider: analysis?.provider,
      report: analysis?.report,
      submission,
      uploadWarning: uploadStorageWarning || undefined,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
