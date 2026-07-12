import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

type SubmissionDetailRouteProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

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
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
