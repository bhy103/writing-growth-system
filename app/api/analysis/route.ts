import { NextResponse } from "next/server";
import { getDemoStudentProfile } from "@/lib/db/demo-user";
import { prisma } from "@/lib/db/prisma";
import { createMockReport } from "@/lib/mock/mock-analysis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return NextResponse.json(
      { message: "Please add a title and English draft before analyzing." },
      { status: 400 },
    );
  }

  const student = await getDemoStudentProfile();
  const report = createMockReport({ title, draft: content });

  const submission = await prisma.writingSubmission.create({
    data: {
      studentId: student.id,
      title,
      content,
      sourceType: "TYPED_TEXT",
      status: "ANALYZED",
      analysis: {
        create: {
          overallLevel: report.overall,
          focusDimension: report.focus,
          strongestDimension: report.strongest.name,
          weakestDimension: report.weakest.name,
          rubricJson: report.dimensions,
          studentFeedback: report.weakest.note,
          parentSummaryZh: null,
        },
      },
    },
    select: {
      id: true,
    },
  });

  return NextResponse.json({
    submissionId: submission.id,
    report,
  });
}
