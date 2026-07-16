import { PDFDocument, type PDFFont, type PDFPage, StandardFonts, rgb } from "pdf-lib";

type MathProblemPdfItem = {
  title: string;
  category: string;
  createdAt: Date;
  fileName?: string | null;
  fileType?: string | null;
  imageBytes?: ArrayBuffer;
  notes?: string | null;
  problemText?: string | null;
  answerText?: string | null;
};

type MathProblemPdfInput = {
  title: string;
  subtitle: string;
  problems: MathProblemPdfItem[];
};

const pageWidth = 595.28;
const pageHeight = 841.89;
const margin = 34;
const contentWidth = pageWidth - margin * 2;
const questionGap = 14;
const compactQuestionHeight = 214;
const largeQuestionHeight = 446;

const unicodePdfReplacements: Record<string, string> = {
  "\u2212": "-",
  "\u2013": "-",
  "\u2014": "-",
  "\u00d7": "x",
  "\u00f7": "/",
  "\u221a": "sqrt",
  "\u2264": "<=",
  "\u2265": ">=",
  "\u2260": "!=",
  "\u2248": "~=",
  "\u00b0": " degrees",
  "\u00b2": "^2",
  "\u00b3": "^3",
  "\u2070": "^0",
  "\u00b9": "^1",
  "\u2074": "^4",
  "\u2075": "^5",
  "\u2076": "^6",
  "\u2077": "^7",
  "\u2078": "^8",
  "\u2079": "^9",
  "\u2080": "_0",
  "\u2081": "_1",
  "\u2082": "_2",
  "\u2083": "_3",
  "\u2084": "_4",
  "\u2085": "_5",
  "\u2086": "_6",
  "\u2087": "_7",
  "\u2088": "_8",
  "\u2089": "_9",
};

function safePdfText(value: string) {
  return value
    .replace(/[−–—×÷√≤≥≠≈°²³⁰¹⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]/g, (character) => unicodePdfReplacements[character] ?? character)
    .replace(/[^\x09\x0a\x0d\x20-\x7e]/g, "");
}

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
  const words = safePdfText(value).split(/\s+/).filter(Boolean);
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
  font: PDFFont;
  maxLines: number;
  page: PDFPage;
  size: number;
  text: string;
  widthChars: number;
  x: number;
  y: number;
}) {
  let nextY = y;
  const lines = splitLines(text, widthChars).slice(0, maxLines);

  for (const line of lines) {
    page.drawText(safePdfText(line), {
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

function estimateQuestionHeight(problem: MathProblemPdfItem) {
  if (problem.imageBytes && !problem.answerText) {
    return largeQuestionHeight;
  }

  const lineCount = problem.problemText
    ? safePdfText(problem.problemText)
        .split(/\r?\n/)
        .flatMap((textLine) => splitLines(textLine, 58))
        .filter(Boolean).length
    : 0;

  if (lineCount > 8) {
    return largeQuestionHeight;
  }

  return compactQuestionHeight;
}

function drawQuestionLines({
  boldFont,
  height,
  ink,
  muted,
  page,
  problem,
  regularFont,
  x,
  y,
}: {
  boldFont: PDFFont;
  height: number;
  ink: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  page: PDFPage;
  problem: MathProblemPdfItem;
  regularFont: PDFFont;
  x: number;
  y: number;
}) {
  const maxLines = height === largeQuestionHeight ? 18 : 8;
  const text = safePdfText(problem.problemText?.trim() ?? "");

  if (!text) {
    page.drawText("Question text was not extracted. Use the source image above for review.", {
      x,
      y,
      size: 9,
      font: regularFont,
      color: muted,
    });
    return;
  }

  drawWrappedText({
    color: ink,
    font: regularFont,
    maxLines,
    page,
    size: 9.5,
    text,
    widthChars: 64,
    x,
    y,
  });

  if (problem.answerText) {
    page.drawText("Answer moved to the answer key.", {
      x,
      y: y - Math.min(maxLines, splitLines(text, 64).length) * 13 - 8,
      size: 8,
      font: boldFont,
      color: muted,
    });
  }
}

export async function createMathProblemPdf(input: MathProblemPdfInput) {
  const pdf = await PDFDocument.create();
  const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.39, 0.43, 0.48);
  const ink = rgb(0.09, 0.13, 0.2);
  const green = rgb(0.12, 0.43, 0.42);
  const line = rgb(0.82, 0.78, 0.7);

  const cover = pdf.addPage([pageWidth, pageHeight]);
  cover.drawText(safePdfText(input.title), {
    x: margin,
    y: pageHeight - margin - 24,
    size: 24,
    font: boldFont,
    color: ink,
  });
  cover.drawText(safePdfText(input.subtitle), {
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
  cover.drawText("Printable review layout. Questions and answer key are separated for student practice.", {
    x: margin,
    y: pageHeight - margin - 112,
    size: 10,
    font: regularFont,
    color: muted,
  });

  let page = pdf.addPage([pageWidth, pageHeight]);
  let yCursor = pageHeight - margin;

  for (const [index, problem] of input.problems.entries()) {
    const questionHeight = estimateQuestionHeight(problem);

    if (yCursor - questionHeight < margin) {
      page = pdf.addPage([pageWidth, pageHeight]);
      yCursor = pageHeight - margin;
    }

    const y = yCursor - questionHeight;
    const innerX = margin + 12;
    let textY = yCursor - 18;

    page.drawRectangle({
      x: margin,
      y,
      width: contentWidth,
      height: questionHeight,
      borderColor: line,
      borderWidth: 0.7,
    });

    page.drawText(safePdfText(`${index + 1}. ${problem.title}`), {
      x: innerX,
      y: textY,
      size: 11,
      font: boldFont,
      color: ink,
    });
    textY -= 15;

    page.drawText(safePdfText(problem.category), {
      x: innerX,
      y: textY,
      size: 8,
      font: boldFont,
      color: green,
    });
    page.drawText(formatDate(problem.createdAt), {
      x: margin + contentWidth - 74,
      y: textY,
      size: 8,
      font: regularFont,
      color: muted,
    });
    textY -= 18;

    if (problem.imageBytes && !problem.answerText) {
      try {
        const image =
          problem.fileType === "image/png" ? await pdf.embedPng(problem.imageBytes) : await pdf.embedJpg(problem.imageBytes);
        const imageBoxWidth = contentWidth - 24;
        const imageBoxHeight = questionHeight - 98;
        const scale = Math.min(imageBoxWidth / image.width, imageBoxHeight / image.height, 1);
        const scaled = image.scale(scale);

        page.drawImage(image, {
          x: innerX + (imageBoxWidth - scaled.width) / 2,
          y: y + 52 + (imageBoxHeight - scaled.height) / 2,
          width: scaled.width,
          height: scaled.height,
        });

        if (problem.problemText) {
          page.drawText("AI note:", {
            x: innerX,
            y: y + 34,
            size: 8,
            font: boldFont,
            color: muted,
          });
          drawWrappedText({
            color: muted,
            font: regularFont,
            maxLines: 1,
            page,
            size: 8,
            text: safePdfText(problem.problemText),
            widthChars: 80,
            x: innerX + 42,
            y: y + 34,
          });
        }
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
      drawQuestionLines({
        boldFont,
        height: questionHeight,
        ink,
        muted,
        page,
        problem,
        regularFont,
        x: innerX,
        y: textY,
      });
    }

    if (problem.notes) {
      drawWrappedText({
        color: muted,
        font: regularFont,
        maxLines: 2,
        page,
        size: 8,
        text: `Note: ${problem.notes}`,
        widthChars: 84,
        x: innerX,
        y: y + 36,
      });
    }

    page.drawLine({
      start: { x: innerX, y: y + 28 },
      end: { x: margin + contentWidth - 12, y: y + 28 },
      color: line,
      thickness: 0.7,
    });
    page.drawText("Review:", {
      x: innerX,
      y: y + 14,
      size: 8,
      font: boldFont,
      color: muted,
    });

    yCursor = y - questionGap;
  }

  const answers = input.problems
    .map((problem, index) => ({ index: index + 1, problem }))
    .filter(({ problem }) => problem.answerText?.trim());

  if (answers.length > 0) {
    page = pdf.addPage([pageWidth, pageHeight]);
    yCursor = pageHeight - margin;
    page.drawText("Answer Key", {
      x: margin,
      y: yCursor,
      size: 22,
      font: boldFont,
      color: ink,
    });
    yCursor -= 30;
    page.drawText("Answers are separated from the question pages so the student can practise first.", {
      x: margin,
      y: yCursor,
      size: 10,
      font: regularFont,
      color: muted,
    });
    yCursor -= 28;

    for (const { index, problem } of answers) {
      const answerLines = splitLines(safePdfText(problem.answerText ?? ""), 86);
      const neededHeight = 28 + answerLines.length * 13;

      if (yCursor - neededHeight < margin) {
        page = pdf.addPage([pageWidth, pageHeight]);
        yCursor = pageHeight - margin;
      }

      page.drawText(safePdfText(`${index}. ${problem.title}`), {
        x: margin,
        y: yCursor,
        size: 11,
        font: boldFont,
        color: ink,
      });
      yCursor -= 15;

      for (const lineText of answerLines) {
        page.drawText(safePdfText(lineText), {
          x: margin + 16,
          y: yCursor,
          size: 10,
          font: regularFont,
          color: ink,
        });
        yCursor -= 13;
      }

      yCursor -= 10;
    }
  }

  return Buffer.from(await pdf.save());
}
