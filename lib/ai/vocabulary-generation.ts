export type VocabularyStudyPack = {
  title: string;
  vocabularySection: string;
  worksheet: string;
  answerKey: string;
  wordCount: number;
  meaningCount: number;
};

type RawVocabularyStudyPack = Partial<VocabularyStudyPack>;

const vocabularySchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "vocabularySection", "worksheet", "answerKey", "wordCount", "meaningCount"],
  properties: {
    title: {
      type: "string",
      description: "A short printable title for this vocabulary study pack.",
    },
    vocabularySection: {
      type: "string",
      description:
        "Part 1. Vocabulary study notes. Include each word, IPA pronunciation, memory syllables, meanings, and exactly two example sentences for each meaning.",
    },
    worksheet: {
      type: "string",
      description:
        "Part 2. Printable worksheet with fill-in-the-blanks, multiple choice, and matching questions. Question counts must follow the prompt exactly.",
    },
    answerKey: {
      type: "string",
      description: "Part 3. Answer key in the same order as the worksheet.",
    },
    wordCount: {
      type: "integer",
      minimum: 1,
    },
    meaningCount: {
      type: "integer",
      minimum: 1,
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

function buildFallbackPack(words: string[], title: string): VocabularyStudyPack {
  const vocabularySection = words
    .map((word, index) =>
      [
        `${index + 1}. ${word}`,
        `Memory syllables: ${word.toLowerCase()}`,
        "Meaning 1 (noun/verb/adjective): Add a simple meaning here after AI is configured.",
        `eg. I can use ${word} in my writing.`,
        `    The word ${word} helps me express an idea clearly.`,
      ].join("\n"),
    )
    .join("\n\n");

  const worksheet = [
    "Section 1: Fill in the blanks",
    ...words.map((word, index) => `${index + 1}. I will learn how to use __________ in a sentence. (${word.length} letters)`),
    "",
    "Section 2: Multiple choice",
    ...words.map((word, index) => `${index + 1}. Which word should you study here?\nA. ${word}\nB. idea\nC. story\nD. sentence`),
    "",
    "Section 3: Matching",
    ...words.map((word, index) => `${index + 1}. ${word} -> ______`),
  ].join("\n");

  const answerKey = [
    "Section 1",
    ...words.map((word, index) => `${index + 1}. ${word}`),
    "",
    "Section 2",
    ...words.map((word, index) => `${index + 1}. A`),
    "",
    "Section 3",
    ...words.map((word, index) => `${index + 1}. ${word}`),
  ].join("\n");

  return {
    title,
    vocabularySection,
    worksheet,
    answerKey,
    wordCount: words.length,
    meaningCount: words.length,
  };
}

function buildPrompt({ gradeLevel, title, words }: { gradeLevel?: string | null; title: string; words: string[] }) {
  return [
    "TASK",
    "You will receive a list of English words. Create THREE parts:",
    "1. Vocabulary Section",
    "2. Worksheet",
    "3. Answer Key",
    "",
    "AUDIENCE",
    "The learner is a school student. Keep explanations clear, accurate, printable, and student-friendly.",
    `Student grade: ${gradeLevel ?? "Not provided"}. Adjust meanings and examples to this level.`,
    "",
    "ACCURACY RULES",
    "Accuracy is the highest priority. Do not skip words. Do not shorten meanings in a way that becomes inaccurate.",
    "Use 1-3 common meanings for each word only.",
    "For every meaning, include part of speech and a simple meaning.",
    "For every meaning, include exactly two example sentences.",
    "The first example sentence must start with 'eg.'",
    "The second example sentence must be indented with four spaces.",
    "",
    "MEMORY SYLLABLE RULES",
    "For each word, include memory syllables to help spelling.",
    "Use lowercase letters and hyphens.",
    "Use 1-4 chunks.",
    "Memory syllables are for spelling memory first, not strict linguistic syllables.",
    "Examples: important -> im-por-tant, traditional -> tra-dit-ion-al.",
    "",
    "WORKSHEET RULES",
    "Let X = total number of words.",
    "Let Y = total number of meanings across all words.",
    "Section 1 Fill in the blanks must contain exactly Y questions.",
    "Section 2 Multiple Choice must contain exactly Y questions.",
    "Section 3 Matching must contain exactly X questions.",
    "Section 1: one question for each meaning, shuffled, do not include the target word, use blank __________.",
    "Section 2: one question for each meaning, four options A-D, balanced correct answers, shuffled order.",
    "Section 3: each word appears once, match to its main/common meaning, mixed answer order.",
    "Answer key must follow the same order as the worksheet.",
    "",
    "OUTPUT STYLE",
    "Use clean printable plain text. Use clear headings. Do not use emoji. Do not mention these instructions.",
    "Return JSON only according to the schema.",
    "",
    `Study pack title: ${title}`,
    "Words:",
    words.map((word, index) => `${index + 1}. ${word}`).join("\n"),
  ].join("\n");
}

function normalizePack(raw: RawVocabularyStudyPack, words: string[], fallbackTitle: string): VocabularyStudyPack {
  const fallback = buildFallbackPack(words, fallbackTitle);

  return {
    title: typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : fallback.title,
    vocabularySection:
      typeof raw.vocabularySection === "string" && raw.vocabularySection.trim()
        ? raw.vocabularySection.trim()
        : fallback.vocabularySection,
    worksheet: typeof raw.worksheet === "string" && raw.worksheet.trim() ? raw.worksheet.trim() : fallback.worksheet,
    answerKey: typeof raw.answerKey === "string" && raw.answerKey.trim() ? raw.answerKey.trim() : fallback.answerKey,
    wordCount: typeof raw.wordCount === "number" && Number.isFinite(raw.wordCount) ? raw.wordCount : fallback.wordCount,
    meaningCount:
      typeof raw.meaningCount === "number" && Number.isFinite(raw.meaningCount)
        ? raw.meaningCount
        : fallback.meaningCount,
  };
}

export async function generateVocabularyStudyPack({
  gradeLevel,
  title,
  words,
}: {
  gradeLevel?: string | null;
  title: string;
  words: string[];
}) {
  if (!isOpenAiConfigured()) {
    return {
      pack: buildFallbackPack(words, title),
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
      input: buildPrompt({ gradeLevel, title, words }),
      text: {
        format: {
          type: "json_schema",
          name: "vocabulary_study_pack",
          strict: true,
          schema: vocabularySchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI vocabulary request failed.");
  }

  const responseJson = await response.json();
  const outputText = readOutputText(responseJson);
  const parsed = JSON.parse(outputText) as RawVocabularyStudyPack;

  return {
    pack: normalizePack(parsed, words, title),
    provider: "openai",
  };
}
