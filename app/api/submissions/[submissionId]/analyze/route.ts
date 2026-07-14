import { NextResponse } from "next/server";
import { analyzeWritingWithAi } from "@/lib/ai/writing-analysis";
import { extractWritingFromUpload } from "@/lib/ai/writing-extraction";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { downloadFileFromConfiguredStorage } from "@/lib/upload/upload-storage";

type AnalyzeSubmissionRouteProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

function createAnalysisData(report: Awaited<ReturnType<typeof analyzeWritingWithAi>>["report"], parentSummaryZh: string | null) {
  return {
    overallLevel: report.overall,
    focusDimension: report.focus,
    strongestDimension: report.strongest.name,
    weakestDimension: report.weakest.name,
      rubricJson: {
        dimensions: report.dimensions,
        highlightSentences: report.highlightSentences,
        revisionSuggestions: report.revisionSuggestions,
        nextExercises: report.nextExercises,
        teacherMarks: report.teacherMarks,
      },
    studentFeedback: report.weakest.note,
    parentSummaryZh,
  };
}

export async function POST(_request: Request, { params }: AnalyzeSubmissionRouteProps) {
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
    let title = submission.title;
    let content = submission.content?.trim() ?? "";
    let extractedContent = "";

    if (!content && upload && !upload.storagePath.startsWith("pending-storage/")) {
      const blob = await downloadFileFromConfiguredStorage(upload.storagePath);
      const file = new File([blob], upload.fileName, {
        type: upload.fileType || blob.type || "application/octet-stream",
      });
      const extractedWriting = await extractWritingFromUpload(file);

      if (extractedWriting?.title && /^Untitled \d+$/i.test(title)) {
        title = extractedWriting.title;
      }

      content = extractedWriting?.content?.trim() ?? "";
      extractedContent = content;

      if (extractedContent) {
        await prisma.writingSubmission.update({
          where: {
            id: submission.id,
          },
          data: {
            title,
            content: extractedContent,
            uploads: {
              update: {
                where: {
                  id: upload.id,
                },
                data: {
                  extractedText: extractedContent,
                },
              },
            },
          },
        });
      }
    }

    if (!content) {
      return NextResponse.json(
        {
          message:
            "AI could not read enough English writing from this upload. Please type the draft text or upload a clearer image.",
        },
        { status: 400 },
      );
    }

    const analysis = await analyzeWritingWithAi({
      title,
      draft: content,
      gradeLevel: student.gradeLevel,
    });
    const analysisData = createAnalysisData(analysis.report, analysis.parentSummaryZh);

    await prisma.writingSubmission.update({
      where: {
        id: submission.id,
      },
      data: {
        title,
        content,
        status: "ANALYZED",
        analysis: {
          upsert: {
            create: analysisData,
            update: analysisData,
          },
        },
        uploads:
          upload && content
            ? {
                update: {
                  where: {
                    id: upload.id,
                  },
                  data: {
                    extractedText: extractedContent || content,
                  },
                },
              }
            : undefined,
      },
    });

    return NextResponse.json({
      provider: analysis.provider,
      report: analysis.report,
      submissionId: submission.id,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
