import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFFont, type PDFPage, rgb } from "pdf-lib";

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

function safePdfText(value: string) {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

async function embedMathFont(pdf: PDFDocument) {
  pdf.registerFontkit(fontkit);
  const fontPath = join(process.cwd(), "public", "fonts", "NotoSansMath-Regular.woff");
  const fontBytes = await readFile(fontPath);
  return pdf.embedFont(fontBytes);
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

  const text = cleanStudentQuestionText(problem.problemText ?? "");

  if (hasNumberLinePrompt(text) || splitSubquestions(text).length > 1) {
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

function hasNumberLinePrompt(value: string) {
  return /\bnumber\s+line\b/i.test(value);
}

function cleanStudentQuestionText(value: string) {
  return safePdfText(value)
    .replace(/\\\(\s*\\sqrt\{([^}]+)\}\s*\\\)/g, "√$1")
    .replace(/\\sqrt\{([^}]+)\}/g, "√$1")
    .replace(/-\s*sqrt\{([^}]+)\}/g, "-√$1")
    .replace(/\\\(\s*-\s*\\sqrt\{([^}]+)\}\s*\\\)/g, "-√$1")
    .replace(/\bsqrt\(([^)]+)\)/gi, "√$1")
    .replace(/\bThe number line is (?:shown|marked|drawn)[^.]*\./gi, "")
    .replace(/\bIt is (?:shown|marked|drawn)[^.]*\./gi, "")
    .replace(/\bPoints? (?:are|were)?\s*(?:plotted|marked|labelled|labeled)[^.]*\./gi, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function splitSubquestions(value: string) {
  const text = cleanStudentQuestionText(value);
  const matches = Array.from(text.matchAll(/\b([a-h])\)\s*/gi));

  if (matches.length < 2) {
    return text ? [text] : [];
  }

  return matches
    .map((match, index) => {
      const start = match.index ?? 0;
      const next = matches[index + 1];
      const end = next?.index ?? text.length;
      return text.slice(start, end).trim();
    })
    .filter(Boolean);
}

function drawAnswerLines({
  count,
  line,
  page,
  x,
  y,
  width,
}: {
  count: number;
  line: ReturnType<typeof rgb>;
  page: PDFPage;
  x: number;
  y: number;
  width: number;
}) {
  let nextY = y;

  for (let index = 0; index < count; index += 1) {
    page.drawLine({
      start: { x, y: nextY },
      end: { x: x + width, y: nextY },
      color: line,
      thickness: 0.45,
    });
    nextY -= 19;
  }

  return nextY;
}

function drawBlankNumberLine({
  font,
  ink,
  page,
  x,
  y,
  width,
}: {
  font: PDFFont;
  ink: ReturnType<typeof rgb>;
  page: PDFPage;
  x: number;
  y: number;
  width: number;
}) {
  const startX = x + 22;
  const endX = x + width - 22;
  const tickCount = 6;
  const tickGap = (endX - startX) / tickCount;

  page.drawLine({
    start: { x: startX, y },
    end: { x: endX, y },
    color: ink,
    thickness: 1,
  });
  page.drawLine({
    start: { x: startX, y },
    end: { x: startX + 8, y: y + 4 },
    color: ink,
    thickness: 1,
  });
  page.drawLine({
    start: { x: startX, y },
    end: { x: startX + 8, y: y - 4 },
    color: ink,
    thickness: 1,
  });
  page.drawLine({
    start: { x: endX, y },
    end: { x: endX - 8, y: y + 4 },
    color: ink,
    thickness: 1,
  });
  page.drawLine({
    start: { x: endX, y },
    end: { x: endX - 8, y: y - 4 },
    color: ink,
    thickness: 1,
  });

  for (let index = 0; index <= tickCount; index += 1) {
    const tickX = startX + tickGap * index;
    const label = String(index - 3);

    page.drawLine({
      start: { x: tickX, y: y - 4 },
      end: { x: tickX, y: y + 4 },
      color: ink,
      thickness: 0.8,
    });
    page.drawText(label, {
      x: tickX - (label.length > 1 ? 5 : 3),
      y: y - 18,
      size: 7,
      font,
      color: ink,
    });
  }
}

function drawQuestionLines({
  height,
  ink,
  line,
  muted,
  page,
  problem,
  regularFont,
  x,
  y,
}: {
  height: number;
  ink: ReturnType<typeof rgb>;
  line: ReturnType<typeof rgb>;
  muted: ReturnType<typeof rgb>;
  page: PDFPage;
  problem: MathProblemPdfItem;
  regularFont: PDFFont;
  x: number;
  y: number;
}) {
  const maxLines = height === largeQuestionHeight ? 18 : 8;
  const text = cleanStudentQuestionText(problem.problemText?.trim() ?? "");

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

  const blocks = splitSubquestions(text);
  let nextY = y;

  for (const [blockIndex, block] of blocks.entries()) {
    const hasNumberLine = hasNumberLinePrompt(block);
    const blockMaxLines = hasNumberLine ? 5 : Math.max(3, Math.floor(maxLines / Math.max(blocks.length, 1)));

    nextY = drawWrappedText({
      color: ink,
      font: regularFont,
      maxLines: blockMaxLines,
      page,
      size: 9.5,
      text: block,
      widthChars: 74,
      x,
      y: nextY,
    });
    nextY -= 8;

    if (hasNumberLine) {
      drawBlankNumberLine({
        font: regularFont,
        ink,
        page,
        width: contentWidth - 48,
        x,
        y: nextY - 20,
      });
      nextY -= 62;
    }

    nextY = drawAnswerLines({
      count: hasNumberLine ? 2 : 3,
      line,
      page,
      width: contentWidth - 48,
      x,
      y: nextY,
    });
    nextY -= blockIndex === blocks.length - 1 ? 0 : 12;
  }
}

export async function createMathProblemPdf(input: MathProblemPdfInput) {
  const pdf = await PDFDocument.create();
  const regularFont = await embedMathFont(pdf);
  const boldFont = regularFont;
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
      font: regularFont,
      color: ink,
    });
    textY -= 28;

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
        height: questionHeight,
        ink,
        line,
        muted,
        page,
        problem,
        regularFont,
        x: innerX,
        y: textY,
      });
    }

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
        font: regularFont,
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
