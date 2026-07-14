import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createSimpleTextPdf } from "@/lib/pdf/simple-pdf";

type VocabularyPdfRouteProps = {
  params: Promise<{
    setId: string;
  }>;
};

export async function GET(_request: Request, { params }: VocabularyPdfRouteProps) {
  try {
    const { setId } = await params;
    const student = await requireCurrentStudentProfile();
    const set = await getPrisma().vocabularySet.findFirst({
      where: {
        id: setId,
        studentId: student.id,
      },
    });

    if (!set) {
      return NextResponse.json({ message: "Vocabulary set not found." }, { status: 404 });
    }

    const pdf = createSimpleTextPdf({
      title: set.title,
      subtitle: `${student.displayName} | Vocabulary study pack | ${new Intl.DateTimeFormat("en-AU").format(set.createdAt)}`,
      sections: [
        {
          heading: "Vocabulary Section",
          body: set.vocabularySection,
        },
        {
          heading: "Worksheet",
          body: set.worksheet,
        },
        {
          heading: "Answer Key",
          body: set.answerKey,
        },
      ],
    });

    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${set.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "vocabulary-pack"}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
