export type MathProblemClassification = {
  title: string;
  category: string;
  problemText: string;
};

type RawMathProblemClassification = Partial<MathProblemClassification>;

const classificationSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "category", "problemText"],
  properties: {
    title: {
      type: "string",
      description: "A short human-readable title for this math problem.",
    },
    category: {
      type: "string",
      description: "The main math topic or knowledge point, such as Fractions, Algebra, Geometry, Decimals, Ratios, Word Problems, Measurement, Statistics, Probability, or Number Patterns.",
    },
    problemText: {
      type: "string",
      description: "The visible math question text transcribed from the image, or the pasted text. Leave empty if unreadable.",
    },
  },
};

function getOpenAiModel() {
  return process.env.OPENAI_VISION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
}

function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function readOutputText(responseJson: unknown) {
  if (!responseJson || typeof responseJson !== "object") {
    return "";
  }

  const response = responseJson as Record<string, unknown>;

  if (typeof response.output_text === "string") {
    return response.output_text;
  }

  const output = response.output;

  if (!Array.isArray(output)) {
    return "";
  }

  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const content = (item as Record<string, unknown>).content;

      if (!Array.isArray(content)) {
        return [];
      }

      return content
        .map((contentItem) => {
          if (!contentItem || typeof contentItem !== "object") {
            return "";
          }

          const record = contentItem as Record<string, unknown>;
          return typeof record.text === "string" ? record.text : "";
        })
        .filter(Boolean);
    })
    .join("");
}

function normalizeClassification(raw: RawMathProblemClassification, fallbackTitle: string): MathProblemClassification {
  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim().slice(0, 120) : fallbackTitle,
    category: typeof raw.category === "string" && raw.category.trim() ? raw.category.trim().slice(0, 80) : "General",
    problemText: typeof raw.problemText === "string" ? raw.problemText.trim() : "",
  };
}

function fallbackFromText(text: string, fallbackTitle: string): MathProblemClassification {
  return {
    title: fallbackTitle,
    category: "General",
    problemText: text.trim(),
  };
}

export async function classifyMathProblem({
  fallbackTitle,
  file,
  text,
}: {
  fallbackTitle: string;
  file?: File;
  text?: string;
}): Promise<MathProblemClassification> {
  const pastedText = text?.trim() ?? "";

  if (!isOpenAiConfigured()) {
    return fallbackFromText(pastedText, fallbackTitle);
  }

  const content: Array<Record<string, string>> = [
    {
      type: "input_text",
      text: [
        "You are organising a student's math mistake book.",
        "Read the pasted math problem or the uploaded image.",
        "Create a short title and classify the main tested knowledge point.",
        "Use one specific category, not a long sentence. Good examples: Fractions, Linear Equations, Area and Perimeter, Percentages, Ratios, Decimals, Place Value, Probability, Statistics, Geometry, Word Problems.",
        "If the image contains multiple questions, classify the main visible question.",
        "Transcribe the visible problem text if possible. Do not solve the problem.",
      ].join("\n"),
    },
  ];

  if (pastedText) {
    content.push({
      type: "input_text",
      text: `Pasted problem text:\n${pastedText}`,
    });
  }

  if (file) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/png";
    content.push({
      type: "input_image",
      image_url: `data:${mimeType};base64,${bytes.toString("base64")}`,
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      input: [
        {
          role: "user",
          content,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "math_problem_classification",
          strict: true,
          schema: classificationSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    return fallbackFromText(pastedText, fallbackTitle);
  }

  const outputText = readOutputText(await response.json());

  try {
    return normalizeClassification(JSON.parse(outputText) as RawMathProblemClassification, fallbackTitle);
  } catch {
    return fallbackFromText(pastedText, fallbackTitle);
  }
}
