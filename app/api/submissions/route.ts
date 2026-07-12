import { NextResponse } from "next/server";
import { getDemoStudentProfile } from "@/lib/db/demo-user";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const student = await getDemoStudentProfile();
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
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!title || !content) {
    return NextResponse.json(
      { message: "Please add a title and English draft before saving." },
      { status: 400 },
    );
  }

  const student = await getDemoStudentProfile();
  const submission = await prisma.writingSubmission.create({
    data: {
      studentId: student.id,
      title,
      content,
      sourceType: "TYPED_TEXT",
      status: "DRAFT",
    },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ submission });
}
