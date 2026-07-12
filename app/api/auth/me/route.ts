import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.studentProfiles[0]?.displayName ?? user.email,
      profileComplete: Boolean(user.accountProfile && user.studentProfiles.length > 0),
      role: user.role,
    },
  });
}
