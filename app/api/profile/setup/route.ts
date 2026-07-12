import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { getCurrentUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before setting up a profile." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parentName = typeof body?.parentName === "string" ? body.parentName.trim() : "";
    const parentBirthday = parseOptionalDate(body?.parentBirthday);
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const studentName = typeof body?.studentName === "string" ? body.studentName.trim() : "";
    const studentBirthday = parseOptionalDate(body?.studentBirthday);
    const gradeLevel = typeof body?.gradeLevel === "string" ? body.gradeLevel.trim() : "";
    const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";

    if (!parentName || !studentName) {
      return NextResponse.json({ message: "Please enter a parent name and student name." }, { status: 400 });
    }

    const prisma = getPrisma();

    await prisma.accountProfile.upsert({
      where: { userId: user.id },
      update: {
        parentName,
        parentBirthday,
        address: address || null,
      },
      create: {
        userId: user.id,
        parentName,
        parentBirthday,
        address: address || null,
      },
    });

    const existingStudent = await prisma.studentProfile.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    const student = existingStudent
      ? await prisma.studentProfile.update({
          where: { id: existingStudent.id },
          data: {
            displayName: studentName,
            birthday: studentBirthday,
            gradeLevel: gradeLevel || null,
            schoolName: schoolName || null,
          },
          select: { id: true, displayName: true },
        })
      : await prisma.studentProfile.create({
          data: {
            userId: user.id,
            displayName: studentName,
            birthday: studentBirthday,
            gradeLevel: gradeLevel || null,
            schoolName: schoolName || null,
            nativeLanguage: "zh-CN",
          },
          select: { id: true, displayName: true },
        });

    return NextResponse.json({ student });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
