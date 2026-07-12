import { NextResponse } from "next/server";

export function apiErrorResponse(error: unknown) {
  const detail = error instanceof Error ? error.message : "Unknown server error";

  return NextResponse.json(
    {
      message: "Database request failed. Please check the deployment environment variables.",
      detail,
    },
    { status: 500 },
  );
}
