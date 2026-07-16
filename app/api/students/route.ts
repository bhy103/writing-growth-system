import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { getCurrentStudentId, getCurrentUser, setCurrentStudent } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

function parseOptionalDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    throw new Error("Dates must use DD/MM/YYYY format.");
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCDate() !== Number(day) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCFullYear() !== Number(year)
  ) {
    throw new Error("Please enter a valid date in DD/MM/YYYY format.");
  }

  return parsed;
}

function normalizeThemeColor(value: unknown) {
  if (typeof value !== "string") {
    return "#2f6f55";
  }

  const trimmed = value.trim();

  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : "#2f6f55";
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before managing students." }, { status: 401 });
    }

    const currentStudentId = await getCurrentStudentId();

    return NextResponse.json({
      currentStudentId,
      students: user.studentProfiles.map((student) => ({
        id: student.id,
        firstName: student.firstName,
        familyName: student.familyName,
        displayName: student.displayName,
        birthday: student.birthday,
        gender: student.gender,
        gradeLevel: student.gradeLevel,
        schoolName: student.schoolName,
        themeColor: student.themeColor,
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before adding a student." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const familyName = typeof body?.familyName === "string" ? body.familyName.trim() : "";
    const birthday = parseOptionalDate(body?.birthday);
    const gender = typeof body?.gender === "string" ? body.gender.trim() : "";
    const gradeLevel = typeof body?.gradeLevel === "string" ? body.gradeLevel.trim() : "";
    const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";
    const themeColor = normalizeThemeColor(body?.themeColor);

    if (!firstName || !familyName) {
      return NextResponse.json({ message: "Please enter the student's first name and family name." }, { status: 400 });
    }

    const student = await getPrisma().studentProfile.create({
      data: {
        userId: user.id,
        firstName,
        familyName,
        displayName: [firstName, familyName].join(" "),
        birthday,
        gender: gender || null,
        gradeLevel: gradeLevel || null,
        schoolName: schoolName || null,
        nativeLanguage: "en",
        themeColor,
      },
      select: {
        id: true,
        displayName: true,
        themeColor: true,
      },
    });

    await setCurrentStudent(student.id);

    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DD/MM/YYYY")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return apiErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before updating a student." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const studentId = typeof body?.studentId === "string" ? body.studentId : "";
    const belongsToUser = user.studentProfiles.some((student) => student.id === studentId);

    if (!studentId || !belongsToUser) {
      return NextResponse.json({ message: "Please choose a valid student for this account." }, { status: 400 });
    }

    const student = await getPrisma().studentProfile.update({
      where: {
        id: studentId,
      },
      data: {
        themeColor: normalizeThemeColor(body?.themeColor),
      },
      select: {
        id: true,
        themeColor: true,
      },
    });

    return NextResponse.json({ student });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
