import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getPrisma } from "@/lib/db/prisma";

const sessionCookieName = "wgs_session";
const currentStudentCookieName = "wgs_current_student";

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
  cookieStore.delete(currentStudentCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = readUserId(cookieStore.get(sessionCookieName)?.value);

  if (!userId) {
    return null;
  }

  return getPrisma().user.findUnique({
    where: { id: userId },
    include: {
      accountProfile: true,
      studentProfiles: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function requireCurrentStudentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Please log in before using the writing workspace.");
  }

  const cookieStore = await cookies();
  const selectedStudentId = cookieStore.get(currentStudentCookieName)?.value;
  const studentProfile =
    user.studentProfiles.find((profile) => profile.id === selectedStudentId) ?? user.studentProfiles[0];

  if (!studentProfile) {
    throw new Error("Please add a student profile before using the writing workspace.");
  }

  return studentProfile;
}

export async function setCurrentStudent(studentId: string) {
  const cookieStore = await cookies();

  cookieStore.set(currentStudentCookieName, studentId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getCurrentStudentId() {
  const user = await getCurrentUser();

  if (!user || user.studentProfiles.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const selectedStudentId = cookieStore.get(currentStudentCookieName)?.value;
  return user.studentProfiles.some((profile) => profile.id === selectedStudentId)
    ? selectedStudentId ?? null
    : user.studentProfiles[0]?.id ?? null;
}
