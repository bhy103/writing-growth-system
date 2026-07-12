import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { getCurrentUser, setCurrentStudent } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Please log in before switching students." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const studentId = typeof body?.studentId === "string" ? body.studentId : "";
    const belongsToUser = user.studentProfiles.some((student) => student.id === studentId);

    if (!studentId || !belongsToUser) {
      return NextResponse.json({ message: "Please choose a valid student for this account." }, { status: 400 });
    }

    await setCurrentStudent(studentId);

    return NextResponse.json({ currentStudentId: studentId });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
