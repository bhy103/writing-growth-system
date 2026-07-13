type ExtractedWriting = {
  content: string;
  title: string;
};

type RawExtraction = {
  content?: unknown;
  title?: unknown;
};

const extractionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "content"],
  properties: {
    title: {
      type: "string",
      description: "The student's visible essay title, or an empty string if there is no clear title.",
    },
    content: {
      type: "string",
      description: "The transcribed English writing exactly as visible. Preserve student wording.",
    },
  },
};

function getOpenAiModel() {
  return process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini";
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

function normalizeExtraction(raw: RawExtraction): ExtractedWriting {
  return {
    content: typeof raw.content === "string" ? raw.content.trim() : "",
    title: typeof raw.title === "string" ? raw.title.trim() : "",
  };
}

function isTextFile(file: File) {
  return file.type === "text/plain" || /\.txt$/i.test(file.name);
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i.test(file.name);
}

export async function extractWritingFromUpload(file?: File): Promise<ExtractedWriting | null> {
  if (!file) {
    return null;
  }

  if (isTextFile(file)) {
    return {
      content: (await file.text()).trim(),
      title: "",
    };
  }

  if (!isImageFile(file) || !isOpenAiConfigured()) {
    return null;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/png";
  const imageUrl = `data:${mimeType};base64,${bytes.toString("base64")}`;
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
          content: [
            {
              type: "input_text",
              text: [
                "You are reading a student's uploaded English writing.",
                "Transcribe the visible writing exactly enough for writing analysis.",
                "Do not rewrite, polish, correct, summarize, or improve the essay.",
                "If a title is clearly visible, return it as title. Otherwise return an empty title.",
                "If some words are unclear, make the best careful transcription and keep the student's meaning.",
              ].join("\n"),
            },
            {
              type: "input_image",
              image_url: imageUrl,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "writing_upload_extraction",
          strict: true,
          schema: extractionSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "OpenAI writing extraction request failed.");
  }

  const outputText = readOutputText(await response.json());
  return normalizeExtraction(JSON.parse(outputText) as RawExtraction);
}
