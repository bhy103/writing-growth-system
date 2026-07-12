import { createMockReport, type MockReport, type WritingDimension } from "@/lib/mock/mock-analysis";

type AiWritingAnalysisResult = {
  report: MockReport;
  parentSummaryZh: string | null;
  provider: "openai" | "mock";
};

type RawAiDimension = {
  key?: unknown;
  name?: unknown;
  zhName?: unknown;
  level?: unknown;
  score?: unknown;
  note?: unknown;
};

type RawAiReport = {
  overall?: unknown;
  focus?: unknown;
  strongest?: RawAiDimension;
  weakest?: RawAiDimension;
  dimensions?: RawAiDimension[];
  parentSummaryZh?: unknown;
};

const dimensionNames = [
  "Ideas",
  "Organization",
  "Vocabulary",
  "Grammar",
  "Sentence Fluency",
  "Mechanics",
] as const;

const zhDimensionNames: Record<string, string> = {
  Ideas: "Ideas",
  Organization: "Organization",
  Vocabulary: "Vocabulary",
  Grammar: "Grammar",
  "Sentence Fluency": "Sentence Fluency",
  Mechanics: "Mechanics",
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["overall", "focus", "strongest", "weakest", "dimensions", "parentSummaryZh"],
  properties: {
    overall: {
      type: "string",
      description: "A student-facing English summary under 55 words.",
    },
    focus: {
      type: "string",
      enum: dimensionNames,
    },
    strongest: { $ref: "#/$defs/dimension" },
    weakest: { $ref: "#/$defs/dimension" },
    dimensions: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: { $ref: "#/$defs/dimension" },
    },
    parentSummaryZh: {
      type: "string",
      description: "A concise English family summary. Do not rewrite the essay.",
    },
  },
  $defs: {
    dimension: {
      type: "object",
      additionalProperties: false,
      required: ["key", "name", "zhName", "level", "score", "note"],
      properties: {
        key: {
          type: "string",
          enum: ["ideas", "organization", "vocabulary", "grammar", "sentence_fluency", "mechanics"],
        },
        name: {
          type: "string",
          enum: dimensionNames,
        },
        zhName: {
          type: "string",
        },
        level: {
          type: "string",
          enum: ["Strong", "Developing", "Practice", "Focus"],
        },
        score: {
          type: "integer",
          minimum: 1,
          maximum: 5,
        },
        note: {
          type: "string",
          description: "One actionable, child-friendly English note. Do not write the sentence for the child.",
        },
      },
    },
  },
};

function getOpenAiModel() {
  return process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
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

function normalizeDimension(raw: RawAiDimension, fallback: WritingDimension): WritingDimension {
  const name = typeof raw.name === "string" ? raw.name : fallback.name;
  const score = typeof raw.score === "number" && Number.isInteger(raw.score)
    ? Math.min(5, Math.max(1, raw.score))
    : fallback.score;

  return {
    key: typeof raw.key === "string" ? raw.key : fallback.key,
    name,
    zhName: typeof raw.zhName === "string" ? raw.zhName : zhDimensionNames[name] ?? fallback.zhName,
    level: typeof raw.level === "string" ? raw.level : fallback.level,
    score,
    note: typeof raw.note === "string" ? raw.note : fallback.note,
  };
}

function normalizeAiReport({
  title,
  draft,
  raw,
}: {
  title: string;
  draft: string;
  raw: RawAiReport;
}) {
  const fallback = createMockReport({ title, draft });
  const rawDimensions = Array.isArray(raw.dimensions) ? raw.dimensions : [];
  const dimensions = fallback.dimensions.map((fallbackDimension) => {
    const rawDimension =
      rawDimensions.find((dimension) => dimension.name === fallbackDimension.name || dimension.key === fallbackDimension.key) ??
      {};

    return normalizeDimension(rawDimension, fallbackDimension);
  });
  const strongestFallback = [...dimensions].sort((a, b) => b.score - a.score)[0];
  const weakestFallback = [...dimensions].sort((a, b) => a.score - b.score)[0];
  const strongest = normalizeDimension(raw.strongest ?? {}, strongestFallback);
  const weakest = normalizeDimension(raw.weakest ?? {}, weakestFallback);

  return {
    report: {
      title,
      overall: typeof raw.overall === "string" ? raw.overall : fallback.overall,
      focus: typeof raw.focus === "string" ? raw.focus : weakest.name,
      strongest,
      weakest,
      dimensions,
    },
    parentSummaryZh: typeof raw.parentSummaryZh === "string" ? raw.parentSummaryZh : null,
  };
}

function buildPrompt({ title, draft, gradeLevel }: { title: string; draft: string; gradeLevel?: string | null }) {
  return [
    "You are an English writing coach for primary and middle school students.",
    "Analyze the student's English writing in a supportive, age-appropriate way.",
    "Do not rewrite the full essay. Do not provide a polished replacement essay.",
    "Give specific feedback that helps the student revise with their own words.",
    "Student-facing feedback must be in English.",
    "The family summary must be in English.",
    "Use these six rubric dimensions exactly: Ideas, Organization, Vocabulary, Grammar, Sentence Fluency, Mechanics.",
    `Student grade level: ${gradeLevel ?? "Not provided"}.`,
    `Title: ${title}`,
    "English draft:",
    draft,
  ].join("\n");
}

export async function analyzeWritingWithAi({
  title,
  draft,
  gradeLevel,
}: {
  title: string;
  draft: string;
  gradeLevel?: string | null;
}): Promise<AiWritingAnalysisResult> {
  if (!isOpenAiConfigured()) {
    return {
      report: createMockReport({ title, draft }),
      parentSummaryZh: null,
      provider: "mock",
    };
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      input: buildPrompt({ title, draft, gradeLevel }),
      text: {
        format: {
          type: "json_schema",
          name: "writing_growth_analysis",
          strict: true,
          schema: analysisSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI analysis request failed.");
  }

  const responseJson = await response.json();
  const outputText = readOutputText(responseJson);
  const parsed = JSON.parse(outputText) as RawAiReport;
  const normalized = normalizeAiReport({ title, draft, raw: parsed });

  return {
    ...normalized,
    provider: "openai",
  };
}
