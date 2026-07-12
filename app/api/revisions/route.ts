import { NextResponse } from "next/server";
import { getDemoStudentProfile } from "@/lib/db/demo-user";
import { getPrisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const originalContent = typeof body?.originalContent === "string" ? body.originalContent.trim() : "";
  const revisedContent = typeof body?.revisedContent === "string" ? body.revisedContent.trim() : "";

  if (!revisedContent) {
    return NextResponse.json(
      { message: "Please add a revised English draft before saving." },
      { status: 400 },
    );
  }

  const student = await getDemoStudentProfile();
  const prisma = getPrisma();
  const submission = submissionId
    ? await prisma.writingSubmission.update({
        where: { id: submissionId },
        data: { status: "COMPLETED" },
        select: { id: true },
      })
    : await prisma.writingSubmission.create({
        data: {
          studentId: student.id,
          title: title || "Untitled Writing",
          content: originalContent || revisedContent,
          sourceType: "TYPED_TEXT",
          status: "COMPLETED",
        },
        select: { id: true },
      });

  const revision = await prisma.revision.create({
    data: {
      submissionId: submission.id,
      content: revisedContent,
      note: "Student saved a revised draft.",
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    revision,
    submissionId: submission.id,
  });
}
