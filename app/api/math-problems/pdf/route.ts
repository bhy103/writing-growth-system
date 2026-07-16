import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { createMathProblemPdf, createMathProblemPdfFileName } from "@/lib/pdf/math-problem-pdf";
import { downloadFileFromConfiguredStorage } from "@/lib/upload/upload-storage";

export async function GET(request: Request) {
  try {
    const student = await requireCurrentStudentProfile();
    const url = new URL(request.url);
    const rawCategory = url.searchParams.get("category")?.trim() ?? "";
    const category = rawCategory && rawCategory !== "All" ? rawCategory : "";
    const prisma = getPrisma();
    const problems = await prisma.mathProblem.findMany({
      where: {
        studentId: student.id,
        ...(category ? { category } : {}),
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        title: true,
        category: true,
        notes: true,
        problemText: true,
        fileName: true,
        fileType: true,
        storagePath: true,
        createdAt: true,
      },
    });

    if (problems.length === 0) {
      return NextResponse.json({ message: "No math problems found for this PDF." }, { status: 404 });
    }

    const pdfItems = await Promise.all(
      problems.map(async (problem) => {
        const blob = problem.storagePath ? await downloadFileFromConfiguredStorage(problem.storagePath) : null;
        return {
          title: problem.title,
          category: problem.category,
          createdAt: problem.createdAt,
          fileName: problem.fileName,
          fileType: problem.fileType,
          imageBytes: blob ? await blob.arrayBuffer() : undefined,
          notes: problem.notes,
          problemText: problem.problemText,
        };
      }),
    );
    const generatedAt = new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
    const pdf = await createMathProblemPdf({
      title: category ? `${category} Math Mistakes` : "Math Mistake Book",
      subtitle: `${student.displayName} | Generated ${generatedAt}`,
      problems: pdfItems,
    });

    return new Response(pdf, {
      headers: {
        "Content-Disposition": `attachment; filename="${createMathProblemPdfFileName(category || null)}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
