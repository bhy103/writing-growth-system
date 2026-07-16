import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/error-response";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import {
  createMathOriginalScreenshotPdf,
  createMathOriginalScreenshotPdfFileName,
} from "@/lib/pdf/math-problem-pdf";
import { downloadFileFromConfiguredStorage } from "@/lib/upload/upload-storage";

const mathPdfVersion = "math-original-screenshot-pdf-2026-07-17";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const student = await requireCurrentStudentProfile();
    const url = new URL(request.url);
    const rawCategory = url.searchParams.get("category")?.trim() ?? "";
    const category = rawCategory && rawCategory !== "All" ? rawCategory : "";
    const ids = (url.searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 60);
    const prisma = getPrisma();
    const problems = await prisma.mathProblem.findMany({
      where: {
        studentId: student.id,
        storagePath: {
          not: null,
        },
        ...(category ? { category } : {}),
        ...(ids.length > 0 ? { id: { in: ids } } : {}),
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
        answerText: true,
        fileName: true,
        fileType: true,
        storagePath: true,
        createdAt: true,
      },
    });

    if (problems.length === 0) {
      return NextResponse.json(
        { message: "No screenshot math problems found for this PDF.", version: mathPdfVersion },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
            "X-Math-Pdf-Version": mathPdfVersion,
          },
          status: 404,
        },
      );
    }

    const orderedProblems =
      ids.length > 0
        ? [...problems].sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
        : problems;

    const pdfItems = await Promise.all(
      orderedProblems.map(async (problem) => {
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
          answerText: problem.answerText,
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
    const pdf = await createMathOriginalScreenshotPdf({
      title: ids.length > 0 ? "Original Screenshot Review Pack" : category ? `${category} Original Screenshots` : "Original Math Screenshots",
      subtitle: `${student.displayName} | Generated ${generatedAt}`,
      problems: pdfItems,
    });

    return new Response(pdf, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Content-Disposition": `attachment; filename="${createMathOriginalScreenshotPdfFileName(ids.length > 0 ? "review-pack" : category || null)}"`,
        "Content-Type": "application/pdf",
        "Pragma": "no-cache",
        "X-Math-Pdf-Version": mathPdfVersion,
      },
    });
  } catch (error) {
    const response = apiErrorResponse(error);
    response.headers.set("Cache-Control", "no-store, max-age=0");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Math-Pdf-Version", mathPdfVersion);
    return response;
  }
}
