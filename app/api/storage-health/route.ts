import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { checkSupabaseStorageHealth } from "@/lib/upload/upload-storage";

export async function GET() {
  try {
    await requireCurrentStudentProfile();
    const health = await checkSupabaseStorageHealth();

    return NextResponse.json(health);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
