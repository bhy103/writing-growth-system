import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type MathProblemPdfItem = {
  title: string;
  category: string;
  createdAt: Date;
  fileName?: string | null;
  fileType?: string | null;
  imageBytes?: ArrayBuffer;
  notes?: string | null;
  problemText?: string | null;
};

type MathProblemPdfInput = {
  title: string;
  subtitle: string;
  problems: MathProblemPdfItem[];
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 34;
const cardGap = 12;
const cardWidth = (pageWidth - margin * 2 - cardGap) / 2;
const cardHeight = 214;

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

function drawWrappedText({
  color,
  font,
  maxLines,
  page,
  size,
  text,
  widthChars,
  x,
  y,
}: {
  color: ReturnType<typeof rgb>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  maxLines: number;
  page: ReturnType<PDFDocument["addPage"]>;
  size: number;
  text: string;
  widthChars: number;
  x: number;
  y: number;
}) {
  let nextY = y;
  const lines = splitLines(text, widthChars).slice(0, maxLines);

  for (const line of lines) {
    page.drawText(line, {
      x,
      y: nextY,
      size,
      font,
      color,
    });
    nextY -= size + 4;
  }

  return nextY;
}

export async function createMathProblemPdf(input: MathProblemPdfInput) {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.39, 0.43, 0.48);
  const ink = rgb(0.09, 0.13, 0.2);
  const green = rgb(0.12, 0.43, 0.42);
  const line = rgb(0.82, 0.78, 0.7);
  const paper = rgb(1, 0.99, 0.96);

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
  cover.drawText("Compact printable layout. Answer space is intentionally kept small so more problems fit on each page.", {
    x: margin,
    y: pageHeight - margin - 112,
    size: 10,
    font: regularFont,
    color: muted,
  });

  let page = pdf.addPage([pageWidth, pageHeight]);
  let cardIndexOnPage = 0;

  for (const [index, problem] of input.problems.entries()) {
    if (cardIndexOnPage >= 6) {
      page = pdf.addPage([pageWidth, pageHeight]);
      cardIndexOnPage = 0;
    }

    const row = Math.floor(cardIndexOnPage / 2);
    const column = cardIndexOnPage % 2;
    const x = margin + column * (cardWidth + cardGap);
    const y = pageHeight - margin - (row + 1) * cardHeight - row * cardGap;
    const innerX = x + 12;
    let textY = y + cardHeight - 20;

    page.drawRectangle({
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      color: paper,
      borderColor: line,
      borderWidth: 0.7,
    });

    page.drawText(`${index + 1}. ${problem.title}`, {
      x: innerX,
      y: textY,
      size: 10,
      font: boldFont,
      color: ink,
    });
    textY -= 14;

    page.drawText(problem.category, {
      x: innerX,
      y: textY,
      size: 7.5,
      font: boldFont,
      color: green,
    });
    page.drawText(formatDate(problem.createdAt), {
      x: x + cardWidth - 70,
      y: textY,
      size: 7.5,
      font: regularFont,
      color: muted,
    });
    textY -= 16;

    if (problem.problemText) {
      const textLines = problem.problemText
        .split(/\r?\n/)
        .flatMap((textLine) => splitLines(textLine, 42))
        .filter(Boolean)
        .slice(0, 8);

      for (const lineText of textLines) {
        page.drawText(lineText, {
          x: innerX,
          y: textY,
          size: 9,
          font: regularFont,
          color: ink,
        });
        textY -= 13;
      }

      if (problem.problemText.length > textLines.join(" ").length + 30) {
        page.drawText("...", {
          x: innerX,
          y: textY,
          size: 9,
          font: regularFont,
          color: muted,
        });
      }
    } else if (problem.imageBytes) {
      try {
        const image =
          problem.fileType === "image/png" ? await pdf.embedPng(problem.imageBytes) : await pdf.embedJpg(problem.imageBytes);
        const imageBoxWidth = cardWidth - 24;
        const imageBoxHeight = 112;
        const scale = Math.min(imageBoxWidth / image.width, imageBoxHeight / image.height, 1);
        const scaled = image.scale(scale);

        page.drawImage(image, {
          x: innerX + (imageBoxWidth - scaled.width) / 2,
          y: y + 52 + (imageBoxHeight - scaled.height) / 2,
          width: scaled.width,
          height: scaled.height,
        });
      } catch {
        page.drawText("Image could not be embedded.", {
          x: innerX,
          y: textY,
          size: 9,
          font: regularFont,
          color: muted,
        });
      }
    } else {
      page.drawText("No readable problem text saved.", {
        x: innerX,
        y: textY,
        size: 9,
        font: regularFont,
        color: muted,
      });
    }

    if (problem.notes) {
      drawWrappedText({
        color: muted,
        font: regularFont,
        maxLines: 2,
        page,
        size: 7.5,
        text: `Note: ${problem.notes}`,
        widthChars: 48,
        x: innerX,
        y: y + 36,
      });
    }

    page.drawLine({
      start: { x: innerX, y: y + 28 },
      end: { x: x + cardWidth - 12, y: y + 28 },
      color: line,
      thickness: 0.7,
    });
    page.drawText("Review:", {
      x: innerX,
      y: y + 14,
      size: 7.5,
      font: boldFont,
      color: muted,
    });

    cardIndexOnPage += 1;
  }

  return Buffer.from(await pdf.save());
}
