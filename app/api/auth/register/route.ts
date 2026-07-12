import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { hashPassword } from "@/lib/auth/password";
import { getPasswordIssues } from "@/lib/auth/password-policy";
import { setSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const confirmPassword = typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

    if (!email) {
      return NextResponse.json(
        { message: "Please enter an email." },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: "Passwords do not match." }, { status: 400 });
    }

    const passwordIssues = getPasswordIssues(password);

    if (passwordIssues.length > 0) {
      return NextResponse.json(
        { message: `Password needs ${passwordIssues.join(", ")}.` },
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
