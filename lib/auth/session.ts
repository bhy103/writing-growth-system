import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db/prisma";

const sessionCookieName = "wgs_session";

function getSessionSecret() {
  return process.env.AUTH_SECRET ?? process.env.DATABASE_URL ?? "writing-growth-local-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function createSessionValue(userId: string) {
  return `${userId}.${sign(userId)}`;
}

function readUserId(sessionValue?: string) {
  if (!sessionValue) {
    return null;
  }

  const [userId, signature] = sessionValue.split(".");

  if (!userId || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(userId), "hex");
  const actual = Buffer.from(signature, "hex");

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return userId;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = readUserId(cookieStore.get(sessionCookieName)?.value);

  if (!userId) {
    return null;
  }

  return getPrisma().user.findUnique({
    where: { id: userId },
    include: { studentProfile: true },
  });
}

export async function requireCurrentStudentProfile() {
  const user = await getCurrentUser();

  if (!user?.studentProfile) {
    throw new Error("Please log in before using the writing workspace.");
  }

  return user.studentProfile;
}
