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
    const prisma = getPrisma();
    const set = await prisma.vocabularySet.findFirst({
      where: {
        id: setId,
        studentId: student.id,
      },
    });

    if (!set) {
      return NextResponse.json({ message: "Vocabulary set not found." }, { status: 404 });
    }

    const archiveNumber = await prisma.vocabularySet.count({
      where: {
        studentId: student.id,
        createdAt: {
          lte: set.createdAt,
        },
      },
    });
    const generatedAt = new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      year: "numeric",
    }).format(set.createdAt);
    const fileNameBase = `${String(archiveNumber).padStart(3, "0")}-${set.title}`
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    const pdf = createSimpleTextPdf({
      title: set.title,
      subtitle: `${student.displayName} | Generated ${generatedAt} | Archive #${String(archiveNumber).padStart(3, "0")}`,
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
          pageBreakBefore: true,
        },
      ],
    });

    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${fileNameBase || "vocabulary-study"}.pdf"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
