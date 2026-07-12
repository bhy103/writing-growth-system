import { NextResponse } from "next/server";

export function apiErrorResponse(error: unknown) {
  const detail = error instanceof Error ? error.message : "Unknown server error";

  if (detail.includes("Please log in")) {
    return NextResponse.json({ message: detail }, { status: 401 });
  }

  if (
    detail.includes("Unable to store the uploaded file") ||
    detail.includes("Object storage is not configured") ||
    detail.includes("Bucket not found") ||
    detail.includes("storage/v1")
  ) {
    return NextResponse.json(
      {
        message: "File storage failed. Please check the Supabase storage environment variables.",
        detail,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      message: "Database request failed. Please check the deployment environment variables.",
      detail,
    },
    { status: 500 },
  );
}
