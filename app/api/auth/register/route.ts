import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { hashPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!displayName || !email || password.length < 8) {
      return NextResponse.json(
        { message: "Please enter a student name, email, and password with at least 8 characters." },
        { status: 400 },
      );
    }

    const { hash, salt } = hashPassword(password);
    const prisma = getPrisma();
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        passwordSalt: salt,
        role: "STUDENT",
        studentProfile: {
          create: {
            displayName,
            gradeLevel: null,
            nativeLanguage: "zh-CN",
          },
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    await setSession(user.id);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    return apiErrorResponse(error);
  }
}
