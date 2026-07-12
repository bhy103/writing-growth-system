import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { type MockReport, type WritingDimension } from "@/lib/mock/mock-analysis";

type SubmissionDetailRouteProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

function isWritingDimension(value: unknown): value is WritingDimension {
  if (!value || typeof value !== "object") {
    return false;
  }

  const dimension = value as Record<string, unknown>;

  return (
    typeof dimension.key === "string" &&
    typeof dimension.name === "string" &&
    typeof dimension.zhName === "string" &&
    typeof dimension.level === "string" &&
    typeof dimension.score === "number" &&
    typeof dimension.note === "string"
  );
}

function buildReport(submission: {
  title: string;
  analysis: {
    overallLevel: string;
    focusDimension: string;
    strongestDimension: string | null;
    weakestDimension: string | null;
    rubricJson: unknown;
  } | null;
}): MockReport | null {
  const analysis = submission.analysis;

  if (!analysis || !Array.isArray(analysis.rubricJson)) {
    return null;
  }

  const dimensions = analysis.rubricJson.filter(isWritingDimension);

  if (dimensions.length === 0) {
    return null;
  }

  const strongest =
    dimensions.find((dimension) => dimension.name === analysis.strongestDimension) ??
    [...dimensions].sort((a, b) => b.score - a.score)[0];
  const weakest =
    dimensions.find((dimension) => dimension.name === analysis.weakestDimension) ??
    [...dimensions].sort((a, b) => a.score - b.score)[0];

  return {
    title: submission.title,
    overall: analysis.overallLevel,
    focus: analysis.focusDimension,
    strongest,
    weakest,
    dimensions,
  };
}

export async function GET(_request: Request, { params }: SubmissionDetailRouteProps) {
  try {
    const { submissionId } = await params;
    const student = await requireCurrentStudentProfile();
    const submission = await getPrisma().writingSubmission.findFirst({
      where: {
        id: submissionId,
        studentId: student.id,
      },
      include: {
        analysis: true,
        uploads: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
        revisions: {
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

    return NextResponse.json({
      submission: {
        id: submission.id,
        title: submission.title,
        content: submission.content ?? "",
        status: submission.status,
        focus: submission.analysis?.focusDimension ?? "Not analyzed",
        latestRevision: submission.revisions[0]?.content ?? "",
        upload: submission.uploads[0]
          ? {
              fileName: submission.uploads[0].fileName,
              fileType: submission.uploads[0].fileType,
              fileSize: submission.uploads[0].fileSize,
              extractionConfidence: submission.uploads[0].extractionConfidence,
            }
          : null,
        report: buildReport(submission),
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
