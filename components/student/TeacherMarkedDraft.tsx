import { type MockReport } from "@/lib/mock/mock-analysis";

type TeacherMarkedDraftProps = {
  draft: string;
  report: MockReport;
};

type Mark = {
  category?: string;
  example?: string;
  note: string;
  type: "correction" | "focus" | "praise";
};

function splitSentences(draft: string) {
  return draft
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [];
}

function sentenceIncludes(sentence: string, pattern: RegExp) {
  return pattern.test(sentence);
}

function getAiSentenceMarks(sentence: string, report: MockReport): Mark[] {
  if (!report.teacherMarks?.length) {
    return [];
  }

  const sentenceText = sentence.toLowerCase();
  return report.teacherMarks
    .filter((mark) => {
      const markText = mark.text.toLowerCase();
      return sentenceText.includes(markText) || markText.includes(sentenceText.slice(0, Math.min(48, sentenceText.length)));
    })
    .map((mark) => ({
      category: mark.category,
      example: mark.example,
      note: mark.note,
      type: mark.type,
    }))
    .slice(0, 2);
}

function getFallbackSentenceMark(sentence: string, index: number): Mark | null {
  if (index === 0) {
    return {
      category: "Ideas",
      example: "This gives the reader the topic straight away.",
      note: "Clear opening. You tell the reader where the holiday happened.",
      type: "praise",
    };
  }

  if (sentenceIncludes(sentence, /\bI was little bit\b/i)) {
    return {
      category: "Grammar",
      example: "Try: I was a little bit bored.",
      note: "This phrase needs a small article before 'little bit'.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bThere was many\b/i)) {
    return {
      category: "Grammar",
      example: "Try: There were many tall trees.",
      note: "Because 'trees' is plural, the verb should be plural too.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bscreamed very loud\b/i)) {
    return {
      category: "Grammar",
      example: "Try: I screamed very loudly.",
      note: "Use an adverb to describe how you screamed.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bthis holiday teach me\b/i)) {
    return {
      category: "Grammar",
      example: "Try: this holiday taught me...",
      note: "This reflection needs the correct verb tense.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bI wants\b/i)) {
    return {
      category: "Grammar",
      example: "Try: I want to visit...",
      note: "After 'I', use 'want', not 'wants'.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bdidn't explored\b/i)) {
    return {
      category: "Grammar",
      example: "Try: places we didn't explore.",
      note: "After 'didn't', use the base verb.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bmore fun then\b/i)) {
    return {
      category: "Mechanics",
      example: "Use 'than' when comparing two things.",
      note: "This comparison needs the word 'than'.",
      type: "correction",
    };
  }

  if (sentenceIncludes(sentence, /\bvery nice\b/i)) {
    return {
      category: "Vocabulary",
      example: "What made it nice: sunny, cool, quiet, clear?",
      note: "This is a good place to choose a more exact describing word.",
      type: "focus",
    };
  }

  if (sentenceIncludes(sentence, /\bIt took about two hours\b/i)) {
    return {
      category: "Ideas",
      example: "You could add what you saw, heard, or felt during the drive.",
      note: "This detail is clear, but it could connect more strongly to the story.",
      type: "focus",
    };
  }

  if (sentenceIncludes(sentence, /\bFirst,\b/i)) {
    return {
      category: "Organization",
      example: "Later, you can keep using time words like 'After that' or 'Finally'.",
      note: "Good sequencing word. It helps the reader follow the trip.",
      type: "praise",
    };
  }

  if (sentenceIncludes(sentence, /\bI even saw\b/i)) {
    return {
      category: "Ideas",
      example: "Add how it moved or how you reacted.",
      note: "This is an interesting moment. A small sensory detail would make it stronger.",
      type: "focus",
    };
  }

  if (sentenceIncludes(sentence, /\bOverall,\b/i)) {
    return {
      category: "Organization",
      example: "Explain why this holiday mattered to you.",
      note: "Nice closing signal. Now make the final thought more personal.",
      type: "focus",
    };
  }

  return null;
}

function buildSentenceMarks(sentences: string[], report: MockReport) {
  if (report.teacherMarks?.length) {
    return sentences.map((sentence) => getAiSentenceMarks(sentence, report));
  }

  let correctionCount = 0;
  let focusCount = 0;
  let praiseCount = 0;

  return sentences.map((sentence, index) => {
    const mark = getFallbackSentenceMark(sentence, index);

    if (!mark) {
      return [];
    }

    if (mark.type === "correction") {
      correctionCount += 1;
      return correctionCount <= 5 ? [mark] : [];
    }

    if (mark.type === "focus") {
      focusCount += 1;
      return focusCount <= 4 ? [mark] : [];
    }

    praiseCount += 1;
    return praiseCount <= 2 ? [mark] : [];
  });
}

export function TeacherMarkedDraft({ draft, report }: TeacherMarkedDraftProps) {
  const sentences = splitSentences(draft);
  const sentenceMarks = buildSentenceMarks(sentences, report);
  const teacherSummary = `${report.overall} Main next step: ${report.revisionSuggestions[0]?.suggestion ?? report.weakest.note}`;

  return (
    <section className="panel teacher-markup-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Teacher Markup</p>
          <h3>Red pen review</h3>
        </div>
      </div>
      <div className="teacher-paper">
        {sentences.length > 0 ? (
          sentences.map((sentence, index) => {
            const marks = sentenceMarks[index] ?? [];

            return (
              <p className={marks.some((mark) => mark.type !== "praise") ? "marked-sentence" : ""} key={`${sentence}-${index}`}>
                <span>{sentence}</span>
                {marks.length > 0 && (
                  <em>
                    {marks.map((mark) => (
                      <strong className={`teacher-note ${mark.type}`} key={`${sentence}-${mark.note}`}>
                        {mark.category ? `${mark.category}: ` : ""}
                        {mark.note}
                        {mark.example ? <small>{mark.example}</small> : null}
                      </strong>
                    ))}
                  </em>
                )}
              </p>
            );
          })
        ) : (
          <p>No draft text available for markup yet.</p>
        )}
        <div className="teacher-summary">
          <strong>Teacher note:</strong>
          <span>{teacherSummary}</span>
        </div>
      </div>
    </section>
  );
}
