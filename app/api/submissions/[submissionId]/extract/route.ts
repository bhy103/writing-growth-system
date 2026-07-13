import { NextResponse } from "next/server";
import { extractWritingFromUpload } from "@/lib/ai/writing-extraction";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { downloadFileFromConfiguredStorage } from "@/lib/upload/upload-storage";

type ExtractSubmissionRouteProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(_request: Request, { params }: ExtractSubmissionRouteProps) {
  try {
    const { submissionId } = await params;
    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const submission = await prisma.writingSubmission.findFirst({
      where: {
        id: submissionId,
        studentId: student.id,
      },
      include: {
        uploads: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ message: "Writing submission not found." }, { status: 404 });
    }

    const upload = submission.uploads[0];

    if (!upload || upload.storagePath.startsWith("pending-storage/")) {
      return NextResponse.json(
        { message: "The original file is not available for text extraction yet." },
        { status: 400 },
      );
    }

    const blob = await downloadFileFromConfiguredStorage(upload.storagePath);
    const file = new File([blob], upload.fileName, {
      type: upload.fileType || blob.type || "application/octet-stream",
    });
    const extractedWriting = await extractWritingFromUpload(file);
    const content = extractedWriting?.content?.trim() ?? "";

    if (!content) {
      return NextResponse.json(
        { message: "AI could not read enough English writing from this upload. Please upload a clearer image." },
        { status: 400 },
      );
    }

    const shouldReplaceTitle = /^Untitled \d+$/i.test(submission.title);
    const title = shouldReplaceTitle && extractedWriting?.title ? extractedWriting.title : submission.title;

    await prisma.writingSubmission.update({
      where: {
        id: submission.id,
      },
      data: {
        title,
        content,
        uploads: {
          update: {
            where: {
              id: upload.id,
            },
            data: {
              extractedText: content,
            },
          },
        },
      },
    });

    return NextResponse.json({
      content,
      title,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
