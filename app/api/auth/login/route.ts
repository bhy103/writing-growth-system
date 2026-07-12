import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { verifyPassword } from "@/lib/auth/password";
import { setSession } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const user = await getPrisma().user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        passwordSalt: true,
      },
    });

    if (!user?.passwordHash || !user.passwordSalt || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    await setSession(user.id);

    return NextResponse.json({ user: { id: user.id, email: user.email } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
