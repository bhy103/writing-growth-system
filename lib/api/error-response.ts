import { NextResponse } from "next/server";

function jsonError(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export function apiErrorResponse(error: unknown) {
  const detail = error instanceof Error ? error.message : "Unknown server error";

  if (detail.includes("Please log in")) {
    return jsonError({ message: detail }, 401);
  }

  if (
    detail.includes("Unable to store the uploaded file") ||
    detail.includes("Object storage is not configured") ||
    detail.includes("Bucket not found") ||
    detail.includes("storage/v1")
  ) {
    return jsonError(
      {
        message: "File storage failed. Please check the Supabase storage environment variables.",
        detail,
      },
      500,
    );
  }

  if (detail.includes("WinAnsi") || detail.includes("cannot encode")) {
    return jsonError(
      {
        message: "PDF generation failed. A math symbol could not be encoded in the PDF font.",
        detail,
      },
      500,
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

    return jsonError(
      {
        message: isExtractionError
          ? "AI text extraction failed. Please check the OpenAI API key and vision model settings."
          : "AI analysis failed. Please check the OpenAI API key and model settings.",
        detail,
      },
      500,
    );
  }

  return jsonError(
    {
      message: "Database request failed. Please check the deployment environment variables.",
      detail,
    },
    500,
  );
}
