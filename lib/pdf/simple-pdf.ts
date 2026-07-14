type PdfSection = {
  heading: string;
  body: string;
  pageBreakBefore?: boolean;
};

type PdfDocumentInput = {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
};

const pageWidth = 612;
const pageHeight = 792;
const margin = 54;
const lineHeight = 14;
const bodySize = 10;
const headingSize = 14;
const titleSize = 20;
const maxCharsPerLine = 92;

function sanitizePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function escapePdfText(value: string) {
  return sanitizePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(line: string, maxLength = maxCharsPerLine) {
  const trimmedLine = sanitizePdfText(line).trimEnd();

  if (!trimmedLine) {
    return [""];
  }

  const words = trimmedLine.split(/\s+/);
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

    current = word.length > maxLength ? word.slice(0, maxLength) : word;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function addTextLine(page: string[], text: string, x: number, y: number, size = bodySize) {
  page.push(`BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`);
}

function createPages(input: PdfDocumentInput) {
  const pages: string[][] = [[]];
  let pageIndex = 0;
  let y = pageHeight - margin;

  function currentPage() {
    return pages[pageIndex];
  }

  function ensureSpace(requiredLines = 1) {
    if (y - requiredLines * lineHeight >= margin) {
      return;
    }

    pages.push([]);
    pageIndex += 1;
    y = pageHeight - margin;
  }

  function startNewPage() {
    if (currentPage().length === 0) {
      return;
    }

    pages.push([]);
    pageIndex += 1;
    y = pageHeight - margin;
  }

  function writeLine(text: string, size = bodySize, extraGap = 0) {
    ensureSpace(1);
    addTextLine(currentPage(), text, margin, y, size);
    y -= lineHeight + extraGap;
  }

  writeLine(input.title, titleSize, 8);

  if (input.subtitle) {
    for (const line of wrapLine(input.subtitle, 78)) {
      writeLine(line, bodySize, 0);
    }
    y -= 6;
  }

  for (const section of input.sections) {
    if (section.pageBreakBefore) {
      startNewPage();
    }

    ensureSpace(3);
    y -= 4;
    writeLine(section.heading.toUpperCase(), headingSize, 3);

    for (const rawLine of section.body.split(/\r?\n/)) {
      const wrappedLines = wrapLine(rawLine);
      for (const line of wrappedLines) {
        writeLine(line);
      }
    }
  }

  return pages;
}

export function createSimpleTextPdf(input: PdfDocumentInput) {
  const pageStreams = createPages(input);
  const objects: string[] = [];

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(
    `<< /Type /Pages /Kids [${pageStreams.map((_, index) => `${3 + index * 2} 0 R`).join(" ")}] /Count ${pageStreams.length} >>`,
  );

  pageStreams.forEach((stream, index) => {
    const pageObjectNumber = 3 + index * 2;
    const contentObjectNumber = pageObjectNumber + 1;
    const content = stream.join("\n");

    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${3 + pageStreams.length * 2} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`);
  });

  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "latin1");
}
