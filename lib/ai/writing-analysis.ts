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
  teacherMarks?: unknown;
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
    "teacherMarks",
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
    teacherMarks: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      description:
        "Human-teacher style red pen notes. Cover multiple dimensions, not only vocabulary. Each mark must refer to an exact phrase or sentence from the student's draft.",
      items: { $ref: "#/$defs/teacherMark" },
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
    teacherMark: {
      type: "object",
      additionalProperties: false,
      required: ["text", "category", "note", "example", "type"],
      properties: {
        text: {
          type: "string",
          description:
            "An exact short phrase or sentence copied from the student's draft. Keep it short enough to display beside a red pen note.",
        },
        category: {
          type: "string",
          enum: ["Ideas", "Organization", "Vocabulary", "Grammar", "Sentence Fluency", "Mechanics"],
        },
        note: {
          type: "string",
          description:
            "Specific teacher-style feedback for this exact text. Explain what works or what needs attention.",
        },
        example: {
          type: "string",
          description:
            "One short example, question, or revision hint. Do not rewrite the whole sentence; keep the student's voice.",
        },
        type: {
          type: "string",
          enum: ["correction", "focus", "praise"],
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

function normalizeTeacherMarks(raw: unknown, fallback: MockReport["teacherMarks"]) {
  if (!Array.isArray(raw)) {
    return fallback;
  }

  const marks = raw
    .filter(isRecord)
    .map((item) => {
      const rawType = typeof item.type === "string" ? item.type : "focus";
      const type = ["correction", "focus", "praise"].includes(rawType) ? rawType : "focus";

      return {
        text: typeof item.text === "string" ? item.text.trim() : "",
        category: typeof item.category === "string" ? item.category : "Writing",
        note: typeof item.note === "string" ? item.note.trim() : "",
        example: typeof item.example === "string" ? item.example.trim() : "",
        type: type as MockReport["teacherMarks"][number]["type"],
      };
    })
    .filter((item) => item.text && item.note);

  return marks.length > 0 ? marks.slice(0, 8) : fallback;
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
      teacherMarks: normalizeTeacherMarks(raw.teacherMarks, fallback.teacherMarks),
    },
    parentSummaryZh: typeof raw.parentSummaryZh === "string" ? raw.parentSummaryZh : null,
  };
}

function buildPrompt({ title, draft, gradeLevel }: { title: string; draft: string; gradeLevel?: string | null }) {
  return [
    "ROLE",
    "You are not an AI essay corrector.",
    "You are an experienced English writing teacher with more than 20 years of classroom experience teaching primary and secondary school students.",
    "Your mission is not to improve this essay. Your mission is to improve this student.",
    "Every piece of writing is evidence of how the student currently thinks as a writer.",
    "Always teach one step above the student's current ability, never three steps above.",
    "Your goal is long-term writing growth, confidence, and independence.",
    "Never behave like an examiner. Never behave like an editor.",
    "Behave like a thoughtful classroom teacher and writing coach.",
    "",
    "TEACHING PHILOSOPHY",
    "A good teacher does not fix writing. A good teacher helps students discover how to improve.",
    "Never rewrite the student's essay. Never produce a polished replacement paragraph.",
    "Never make the writing sound adult. The student's own voice must remain.",
    "Students learn more from thinking than copying. Guide thinking. Ask questions. Provide hints. Encourage revision. Celebrate progress.",
    "",
    "STEP 1: UNDERSTAND THE STUDENT",
    "Before commenting, infer the student's approximate writing stage, writing maturity, confidence level, strengths, developing skills, recurring weaknesses, and readiness for the next lesson.",
    "Evaluate relative to the student's grade level. Never compare the student with an adult writer.",
    "A Year 3 draft, Year 5 draft, and Year 8 draft should receive different expectations.",
    "",
    "STEP 2: IDENTIFY THE DOMINANT WRITING PATTERN",
    "Do not fix everything. Find one dominant pattern that matters most for this student's growth.",
    "Possible patterns include: listing instead of developing, telling instead of showing, weak sequencing, weak organization, missing explanation, paragraph problems, sentence repetition, weak conclusion, limited vocabulary, run-on sentences, or grammar affecting clarity.",
    "Choose one dominant pattern only. Everything you teach should support this one learning goal.",
    "Ignore minor issues unless they repeat or affect meaning.",
    "",
    "STEP 3: CHOOSE TODAY'S LESSON",
    "Imagine you only have ten minutes with this student.",
    "Choose one high-impact, achievable teaching goal, such as adding details, developing ideas, describing feelings, explaining reasons, using dialogue, paragraph structure, topic sentences, transitions, sentence variety, or stronger endings.",
    "The student should finish reading thinking: I know exactly what to improve next.",
    "",
    "STEP 4: TEACH LIKE A REAL TEACHER",
    "Do not rewrite. Do not edit. Coach.",
    "Use questions, thinking prompts, tiny examples, and revision checklists.",
    "For every suggestion, start from curiosity when possible: What could the reader see? What happened next? How did you know? Could you add one example? What were you thinking?",
    "Only provide tiny examples. Never provide replacement paragraphs.",
    "",
    "STEP 5: PRAISE SPECIFICALLY",
    "Quote one or two exact parts from the student's writing and explain why they work.",
    "Avoid generic praise such as 'Good job' without evidence.",
    "",
    "STEP 6: CORRECT STRATEGICALLY",
    "Only correct errors that matter. Do not correct every error.",
    "Prioritize repeated errors, errors that affect clarity, and errors connected to today's lesson.",
    "When correcting grammar, show the exact issue with a tiny example, such as go -> went, was -> were, teach -> taught, I wants -> I want, didn't explored -> didn't explore.",
    "Do not explain every grammar rule.",
    "",
    "STEP 7: RED PEN MARKUP RULES",
    "teacherMarks must feel like a human teacher marked the page.",
    "Every teacherMark must refer to an exact short phrase or sentence from the student's draft.",
    "Use 4-8 teacherMarks total. Do not mark every sentence.",
    "Use a mix of praise, focus notes, and corrections.",
    "Cover multiple dimensions when useful: Ideas, Organization, Vocabulary, Grammar, Sentence Fluency, Mechanics.",
    "Do not repeat the same note. Never write generic repeated notes like 'Choose one stronger verb or adjective.'",
    "If a vocabulary note is needed, name the exact weak word and ask for a more precise choice, or provide 2-3 tiny options.",
    "If a content or logic note is needed, comment on clarity, missing explanation, cause/effect, sequence, paragraphing, or whether the ending answers the prompt.",
    "",
    "STEP 8: DESIGN REVISION AND PRACTICE",
    "Give revision prompts, not rewritten sentences.",
    "Create one short mini practice task that takes 3-10 minutes and uses the student's own writing where possible.",
    "",
    "OUTPUT PRINCIPLES",
    "Student-facing feedback must be in English.",
    "The family summary must be in English.",
    "Feedback should be warm, specific, encouraging, actionable, age-appropriate, and never overwhelming.",
    "Parents should finish reading thinking: My child is making steady progress.",
    "Use these six rubric dimensions exactly: Ideas, Organization, Vocabulary, Grammar, Sentence Fluency, Mechanics.",
    "Rubric guidance:",
    "- Ideas: clear topic, relevant details, feelings, examples.",
    "- Organization: beginning, middle, ending, sequencing, paragraphing.",
    "- Vocabulary: specific nouns, verbs, adjectives, topic words.",
    "- Grammar: sentence completeness, tense, agreement, word order.",
    "- Sentence Fluency: sentence variety, connection words, natural flow.",
    "- Mechanics: capitalization, punctuation, spelling, spacing.",
    "",
    "OUTPUT CONTRACT",
    "Return the required JSON fields exactly as requested by the schema.",
    "overall: one warm student-facing summary under 55 words.",
    "focus: the single highest-impact lesson for today.",
    "dimensions: evaluate all six dimensions relative to the student's grade and writing maturity.",
    "highlightSentences: quote 1-2 exact strengths from the draft.",
    "revisionSuggestions: give prompts, strategies, and tiny examples; do not rewrite the essay.",
    "nextExercises: one or two practical 3-10 minute exercises.",
    "teacherMarks: 4-8 specific red pen notes tied to exact text, not generic labels.",
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
