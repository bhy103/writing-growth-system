import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type MathProblemPdfItem = {
  title: string;
  category: string;
  createdAt: Date;
  fileName: string;
  fileType: string;
  imageBytes: ArrayBuffer;
  notes?: string | null;
};

type MathProblemPdfInput = {
  title: string;
  subtitle: string;
  problems: MathProblemPdfItem[];
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 42;

function sanitizePdfFileName(value: string) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export function createMathProblemPdfFileName(category?: string | null) {
  const date = new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
    .format(new Date())
    .replace(/\//g, "-");
  const base = category && category !== "All" ? `math-mistakes-${category}-${date}` : `math-mistakes-${date}`;

  return `${sanitizePdfFileName(base) || "math-mistakes"}.pdf`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function splitLines(value: string, maxLength: number) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
    }

    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [""];
}

export async function createMathProblemPdf(input: MathProblemPdfInput) {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.36, 0.43, 0.4);
  const ink = rgb(0.08, 0.12, 0.1);
  const green = rgb(0.12, 0.43, 0.32);

  const cover = pdf.addPage([pageWidth, pageHeight]);
  cover.drawText(input.title, {
    x: margin,
    y: pageHeight - margin - 24,
    size: 24,
    font: boldFont,
    color: ink,
  });
  cover.drawText(input.subtitle, {
    x: margin,
    y: pageHeight - margin - 52,
    size: 11,
    font: regularFont,
    color: muted,
  });
  cover.drawText(`${input.problems.length} saved problem${input.problems.length === 1 ? "" : "s"}`, {
    x: margin,
    y: pageHeight - margin - 84,
    size: 14,
    font: boldFont,
    color: green,
  });

  for (const [index, problem] of input.problems.entries()) {
    const page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    page.drawText(`${index + 1}. ${problem.title}`, {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: ink,
    });
    y -= 22;

    page.drawText(`${problem.category} | ${formatDate(problem.createdAt)} | ${problem.fileName}`, {
      x: margin,
      y,
      size: 9,
      font: regularFont,
      color: muted,
    });
    y -= 20;

    if (problem.notes) {
      for (const line of splitLines(problem.notes, 86).slice(0, 3)) {
        page.drawText(line, {
          x: margin,
          y,
          size: 10,
          font: regularFont,
          color: muted,
        });
        y -= 13;
      }
      y -= 4;
    }

    try {
      const image =
        problem.fileType === "image/png"
          ? await pdf.embedPng(problem.imageBytes)
          : await pdf.embedJpg(problem.imageBytes);
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = y - margin;
      const scaled = image.scale(Math.min(maxWidth / image.width, maxHeight / image.height, 1));
      const imageX = margin + (maxWidth - scaled.width) / 2;
      const imageY = margin + (maxHeight - scaled.height) / 2;

      page.drawRectangle({
        x: margin - 1,
        y: margin - 1,
        width: maxWidth + 2,
        height: maxHeight + 2,
        borderColor: rgb(0.84, 0.88, 0.85),
        borderWidth: 1,
      });
      page.drawImage(image, {
        x: imageX,
        y: imageY,
        width: scaled.width,
        height: scaled.height,
      });
    } catch {
      page.drawText("This image format could not be embedded in the PDF.", {
        x: margin,
        y: y - 24,
        size: 12,
        font: boldFont,
        color: muted,
      });
    }
  }

  return Buffer.from(await pdf.save());
}
