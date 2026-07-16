import { NextResponse } from "next/server";
import { getCurrentStudentId, getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const currentStudentId = await getCurrentStudentId();
  const currentStudent =
    user.studentProfiles.find((student) => student.id === currentStudentId) ?? user.studentProfiles[0];

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: currentStudent?.displayName ?? user.email,
      currentStudentId,
      students: user.studentProfiles.map((student) => ({
        id: student.id,
        displayName: student.displayName,
        themeColor: student.themeColor,
      })),
      profileComplete: Boolean(user.accountProfile && user.studentProfiles.length > 0),
      role: user.role,
    },
  });
}
