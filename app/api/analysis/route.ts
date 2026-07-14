import { NextResponse } from "next/server";
import { analyzeWritingWithAi } from "@/lib/ai/writing-analysis";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";

    if (!title || !content) {
      return NextResponse.json(
        { message: "Please add a title and English draft before analyzing." },
        { status: 400 },
      );
    }

    const student = await requireCurrentStudentProfile();
    const prisma = getPrisma();
    const analysis = await analyzeWritingWithAi({
      title,
      draft: content,
      gradeLevel: student.gradeLevel,
    });
    const report = analysis.report;
    const analysisData = {
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
      parentSummaryZh: analysis.parentSummaryZh,
    };

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
            status: "ANALYZED",
            analysis: {
              upsert: {
                create: analysisData,
                update: analysisData,
              },
            },
          },
          select: {
            id: true,
          },
        })
      : await prisma.writingSubmission.create({
          data: {
            studentId: student.id,
            title,
            content,
            sourceType: "TYPED_TEXT",
            status: "ANALYZED",
            analysis: {
              create: analysisData,
            },
          },
          select: {
            id: true,
          },
        });

    return NextResponse.json({
      submissionId: submission.id,
      report,
      provider: analysis.provider,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
