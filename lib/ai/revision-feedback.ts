type RevisionFeedbackResult = {
  didImprove: boolean;
  feedback: string;
  nextStep: string;
  status: "improved" | "needs_more_revision";
};

type RawRevisionFeedback = {
  didImprove?: unknown;
  feedback?: unknown;
  nextStep?: unknown;
  status?: unknown;
};

const revisionFeedbackSchema = {
  type: "object",
  additionalProperties: false,
  required: ["status", "didImprove", "feedback", "nextStep"],
  properties: {
    status: {
      type: "string",
      enum: ["improved", "needs_more_revision"],
    },
    didImprove: {
      type: "boolean",
    },
    feedback: {
      type: "string",
      description: "Child-friendly English feedback under 45 words.",
    },
    nextStep: {
      type: "string",
      description: "One concrete next action. Do not rewrite the sentence for the student.",
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

function normalizeRevisionFeedback(raw: RawRevisionFeedback): RevisionFeedbackResult {
  const didImprove = typeof raw.didImprove === "boolean" ? raw.didImprove : raw.status === "improved";

  return {
    didImprove,
    feedback:
      typeof raw.feedback === "string"
        ? raw.feedback
        : didImprove
          ? "Your revision is stronger because it responds to the writing focus."
          : "Your revision is saved. Try making one clearer change connected to the focus.",
    nextStep:
      typeof raw.nextStep === "string"
        ? raw.nextStep
        : "Choose one sentence and revise it again using the current focus.",
    status: didImprove ? "improved" : "needs_more_revision",
  };
}

function buildRevisionPrompt({
  focus,
  originalContent,
  revisedContent,
}: {
  focus: string;
  originalContent: string;
  revisedContent: string;
}) {
  return [
    "You are an English writing coach for students.",
    "Compare the student's original draft and revised draft.",
    "Check whether the revision improves the current focus skill.",
    "Do not rewrite the student's work. Do not provide a polished replacement.",
    "Give short, encouraging feedback and one next action.",
    `Current focus: ${focus}`,
    "Original draft:",
    originalContent,
    "Revised draft:",
    revisedContent,
  ].join("\n");
}

export async function reviewRevisionWithAi({
  focus,
  originalContent,
  revisedContent,
}: {
  focus: string;
  originalContent: string;
  revisedContent: string;
}): Promise<RevisionFeedbackResult> {
  if (!isOpenAiConfigured()) {
    const didImprove = revisedContent.trim().length > originalContent.trim().length;

    return {
      didImprove,
      feedback: didImprove
        ? `Good revision. You added more writing while working on ${focus}.`
        : `Your revision is saved. Try adding one clearer change for ${focus}.`,
      nextStep: `Pick one sentence and improve it for ${focus}.`,
      status: didImprove ? "improved" : "needs_more_revision",
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
      input: buildRevisionPrompt({ focus, originalContent, revisedContent }),
      text: {
        format: {
          type: "json_schema",
          name: "writing_revision_feedback",
          strict: true,
          schema: revisionFeedbackSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI revision feedback request failed.");
  }

  const responseJson = await response.json();
  const outputText = readOutputText(responseJson);
  const parsed = JSON.parse(outputText) as RawRevisionFeedback;

  return normalizeRevisionFeedback(parsed);
}
