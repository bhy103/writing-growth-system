import { NextResponse } from "next/server";
import { extractWritingFromUpload } from "@/lib/ai/writing-extraction";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    await requireCurrentStudentProfile();
    const formData = await request.formData();
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;

    if (!file) {
      return NextResponse.json({ message: "Please choose an uploaded writing file first." }, { status: 400 });
    }

    const extractedWriting = await extractWritingFromUpload(file);

    if (!extractedWriting?.content) {
      return NextResponse.json(
        {
          message:
            "AI could not read writing from this file. You can type the text manually, or upload a clearer image.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      content: extractedWriting.content,
      title: extractedWriting.title,
      wordCount: extractedWriting.content.trim().split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
