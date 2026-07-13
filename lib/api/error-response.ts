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

  if (
    detail.includes("OpenAI") ||
    detail.includes("openai") ||
    detail.includes("invalid_request_error") ||
    detail.includes("Incorrect API key") ||
    detail.includes("insufficient_quota") ||
    detail.includes("model_not_found")
  ) {
    const isExtractionError =
      detail.includes("extraction") ||
      detail.includes("input_image") ||
      detail.includes("image_url") ||
      detail.includes("vision");

    return NextResponse.json(
      {
        message: isExtractionError
          ? "AI text extraction failed. Please check the OpenAI API key and vision model settings."
          : "AI analysis failed. Please check the OpenAI API key and model settings.",
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
