import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { getCurrentUser } from "@/lib/auth/session";
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

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before setting up a profile." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parentTitle = typeof body?.parentTitle === "string" ? body.parentTitle.trim() : "";
    const parentFirstName = typeof body?.parentFirstName === "string" ? body.parentFirstName.trim() : "";
    const parentFamilyName = typeof body?.parentFamilyName === "string" ? body.parentFamilyName.trim() : "";
    const parentName = [parentTitle, parentFirstName, parentFamilyName].filter(Boolean).join(" ");
    const parentBirthday = parseOptionalDate(body?.parentBirthday);
    const streetAddress = typeof body?.streetAddress === "string" ? body.streetAddress.trim() : "";
    const suburb = typeof body?.suburb === "string" ? body.suburb.trim() : "";
    const state = typeof body?.state === "string" ? body.state.trim() : "";
    const postcode = typeof body?.postcode === "string" ? body.postcode.trim() : "";
    const studentFirstName = typeof body?.studentFirstName === "string" ? body.studentFirstName.trim() : "";
    const studentFamilyName = typeof body?.studentFamilyName === "string" ? body.studentFamilyName.trim() : "";
    const studentName = [studentFirstName, studentFamilyName].filter(Boolean).join(" ");
    const studentBirthday = parseOptionalDate(body?.studentBirthday);
    const gradeLevel = typeof body?.gradeLevel === "string" ? body.gradeLevel.trim() : "";
    const gender = typeof body?.gender === "string" ? body.gender.trim() : "";
    const schoolName = typeof body?.schoolName === "string" ? body.schoolName.trim() : "";

    if (!parentFirstName || !parentFamilyName || !studentFirstName || !studentFamilyName) {
      return NextResponse.json(
        { message: "Please enter first name and family name for both parent and student." },
        { status: 400 },
      );
    }

    if (postcode && !/^\d{4}$/.test(postcode)) {
      return NextResponse.json({ message: "Australian postcodes must be 4 digits." }, { status: 400 });
    }

    const prisma = getPrisma();

    await prisma.accountProfile.upsert({
      where: { userId: user.id },
      update: {
        title: parentTitle || null,
        parentFirstName,
        parentFamilyName,
        parentName,
        parentBirthday,
        address: [streetAddress, suburb, state, postcode].filter(Boolean).join(", ") || null,
        streetAddress: streetAddress || null,
        suburb: suburb || null,
        state: state || null,
        postcode: postcode || null,
      },
      create: {
        userId: user.id,
        title: parentTitle || null,
        parentFirstName,
        parentFamilyName,
        parentName,
        parentBirthday,
        address: [streetAddress, suburb, state, postcode].filter(Boolean).join(", ") || null,
        streetAddress: streetAddress || null,
        suburb: suburb || null,
        state: state || null,
        postcode: postcode || null,
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
            firstName: studentFirstName,
            familyName: studentFamilyName,
            displayName: studentName,
            birthday: studentBirthday,
            gradeLevel: gradeLevel || null,
            gender: gender || null,
            schoolName: schoolName || null,
          },
          select: { id: true, displayName: true },
        })
      : await prisma.studentProfile.create({
          data: {
            userId: user.id,
            firstName: studentFirstName,
            familyName: studentFamilyName,
            displayName: studentName,
            birthday: studentBirthday,
            gradeLevel: gradeLevel || null,
            gender: gender || null,
            schoolName: schoolName || null,
            nativeLanguage: "zh-CN",
          },
          select: { id: true, displayName: true },
        });

    return NextResponse.json({ student });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DD/MM/YYYY")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return apiErrorResponse(error);
  }
}
