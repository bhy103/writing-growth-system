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

function getSentenceMarks(sentence: string, report: MockReport, index: number): Mark[] {
  if (report.teacherMarks?.length) {
    const sentenceText = sentence.toLowerCase();
    const aiMarks = report.teacherMarks
      .filter((mark) => {
        const markText = mark.text.toLowerCase();
        return sentenceText.includes(markText) || markText.includes(sentenceText.slice(0, Math.min(48, sentenceText.length)));
      })
      .map((mark) => ({
        category: mark.category,
        example: mark.example,
        note: mark.note,
        type: mark.type,
      }));

    if (aiMarks.length > 0) {
      return aiMarks.slice(0, 2);
    }
  }

  const marks: Mark[] = [];
  const focus = report.focus.toLowerCase();

  if (index === 0 && report.highlightSentences.length > 0) {
    marks.push({
      note: "Good opening.",
      type: "praise",
    });
  }

  if (/\bi\b/.test(sentence)) {
    marks.push({
      note: "Capitalize I.",
      type: "correction",
    });
  }

  if (/\s+[,.!?]/.test(sentence)) {
    marks.push({
      note: "Check spacing before punctuation.",
      type: "correction",
    });
  }

  if (focus.includes("sentence") && !/\b(because|when|after|although|while)\b/i.test(sentence)) {
    marks.push({
      note: "Try connecting this idea.",
      type: "focus",
    });
  }

  if (focus.includes("vocabulary") && sentence.split(/\s+/).length > 8) {
    marks.push({
      note: "Choose one stronger verb or adjective.",
      type: "focus",
    });
  }

  if (focus.includes("ideas") && !/\b(felt|feel|saw|heard|because|learned|noticed)\b/i.test(sentence)) {
    marks.push({
      note: "Add one detail or feeling.",
      type: "focus",
    });
  }

  if (focus.includes("organization") && index > 0 && !/\b(first|then|next|after|finally|later)\b/i.test(sentence)) {
    marks.push({
      note: "Show the order more clearly.",
      type: "focus",
    });
  }

  if (marks.length === 0 && index === 0) {
    marks.push({
      note: report.strongest.note,
      type: "praise",
    });
  }

  return marks.slice(0, 2);
}

export function TeacherMarkedDraft({ draft, report }: TeacherMarkedDraftProps) {
  const sentences = splitSentences(draft);
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
            const marks = getSentenceMarks(sentence, report, index);

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
