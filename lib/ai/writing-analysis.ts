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
  highlightSentences?: unknown;
  revisionSuggestions?: unknown;
  nextExercises?: unknown;
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
  required: [
    "overall",
    "focus",
    "strongest",
    "weakest",
    "dimensions",
    "highlightSentences",
    "revisionSuggestions",
    "nextExercises",
    "parentSummaryZh",
  ],
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
    highlightSentences: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { $ref: "#/$defs/highlightSentence" },
    },
    revisionSuggestions: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: { $ref: "#/$defs/revisionSuggestion" },
    },
    nextExercises: {
      type: "array",
      minItems: 1,
      maxItems: 2,
      items: { $ref: "#/$defs/nextExercise" },
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
    highlightSentence: {
      type: "object",
      additionalProperties: false,
      required: ["text", "reason", "relatedDimension"],
      properties: {
        text: {
          type: "string",
          description: "One short exact sentence or phrase from the student's draft.",
        },
        reason: {
          type: "string",
          description: "Why this part works well, in child-friendly English.",
        },
        relatedDimension: {
          type: "string",
          enum: dimensionNames,
        },
      },
    },
    revisionSuggestion: {
      type: "object",
      additionalProperties: false,
      required: ["priority", "target", "suggestion", "prompt"],
      properties: {
        priority: {
          type: "integer",
          minimum: 1,
          maximum: 3,
        },
        target: {
          type: "string",
          description: "The specific part or skill the student should improve.",
        },
        suggestion: {
          type: "string",
          description: "A concrete revision strategy. Do not write the revised sentence for the student.",
        },
        prompt: {
          type: "string",
          description: "A question that helps the student revise using their own words.",
        },
      },
    },
    nextExercise: {
      type: "object",
      additionalProperties: false,
      required: ["title", "instruction", "minutes", "difficulty"],
      properties: {
        title: {
          type: "string",
        },
        instruction: {
          type: "string",
        },
        minutes: {
          type: "integer",
          minimum: 3,
          maximum: 15,
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "challenge"],
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function normalizeHighlightSentences(raw: unknown, fallback: MockReport["highlightSentences"]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const highlights = raw
    .filter(isRecord)
    .map((item) => ({
      text: typeof item.text === "string" ? item.text : "",
      reason: typeof item.reason === "string" ? item.reason : "",
      relatedDimension: typeof item.relatedDimension === "string" ? item.relatedDimension : "Ideas",
    }))
    .filter((item) => item.text && item.reason);

  return highlights.length > 0 ? highlights.slice(0, 2) : fallback;
}

function normalizeRevisionSuggestions(raw: unknown, fallback: MockReport["revisionSuggestions"]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const suggestions = raw
    .filter(isRecord)
    .map((item, index) => ({
      priority: typeof item.priority === "number" ? item.priority : index + 1,
      target: typeof item.target === "string" ? item.target : "",
      suggestion: typeof item.suggestion === "string" ? item.suggestion : "",
      prompt: typeof item.prompt === "string" ? item.prompt : "",
    }))
    .filter((item) => item.target && item.suggestion && item.prompt);

  return suggestions.length > 0 ? suggestions.slice(0, 3) : fallback;
}

function normalizeNextExercises(raw: unknown, fallback: MockReport["nextExercises"]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const exercises = raw
    .filter(isRecord)
    .map((item) => ({
      title: typeof item.title === "string" ? item.title : "",
      instruction: typeof item.instruction === "string" ? item.instruction : "",
      minutes: typeof item.minutes === "number" ? Math.min(15, Math.max(3, item.minutes)) : 8,
      difficulty: typeof item.difficulty === "string" ? item.difficulty : "easy",
    }))
    .filter((item) => item.title && item.instruction);

  return exercises.length > 0 ? exercises.slice(0, 2) : fallback;
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
      highlightSentences: normalizeHighlightSentences(raw.highlightSentences, fallback.highlightSentences),
      revisionSuggestions: normalizeRevisionSuggestions(raw.revisionSuggestions, fallback.revisionSuggestions),
      nextExercises: normalizeNextExercises(raw.nextExercises, fallback.nextExercises),
    },
    parentSummaryZh: typeof raw.parentSummaryZh === "string" ? raw.parentSummaryZh : null,
  };
}

function buildPrompt({ title, draft, gradeLevel }: { title: string; draft: string; gradeLevel?: string | null }) {
  return [
    "You are an English writing coach for primary and middle school students. Your job is to help the student become a better writer, not to write for them.",
    "Analyze the student's English writing in a supportive, age-appropriate way using the student's current grade level.",
    "Do not rewrite the full essay. Do not provide a polished replacement essay. Do not make the writing sound adult.",
    "Give concrete feedback that helps the student revise with their own words.",
    "Choose one main growth focus. The student should know exactly what to practice next.",
    "For revision suggestions, give prompts, strategies, and questions. Never provide a complete replacement paragraph.",
    "Highlight one or two exact parts from the student's draft that are already working well.",
    "Next exercises should be short, practical, and doable in 3-15 minutes.",
    "Student-facing feedback must be in English.",
    "The family summary must be in English.",
    "Use these six rubric dimensions exactly: Ideas, Organization, Vocabulary, Grammar, Sentence Fluency, Mechanics.",
    "Rubric guidance:",
    "- Ideas: clear topic, relevant details, feelings, examples.",
    "- Organization: beginning, middle, ending, sequencing, paragraphing.",
    "- Vocabulary: specific nouns, verbs, adjectives, topic words.",
    "- Grammar: sentence completeness, tense, agreement, word order.",
    "- Sentence Fluency: sentence variety, connection words, natural flow.",
    "- Mechanics: capitalization, punctuation, spelling, spacing.",
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
