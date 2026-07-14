import { type MockReport } from "@/lib/mock/mock-analysis";
import { TeacherMarkedDraft } from "./TeacherMarkedDraft";

type AiWritingReportProps = {
  report: MockReport;
  draft: string;
  analysisStatus: "idle" | "analyzing" | "error" | "ready";
  onRetry: () => void;
  onStartRevision: () => void;
};

export function AiWritingReport({ report, draft, analysisStatus, onRetry, onStartRevision }: AiWritingReportProps) {
  const focusDimension =
    report.dimensions.find((dimension) => dimension.name === report.focus) ?? report.weakest;

  return (
    <section className="view active-view" data-testid="view-report">
      {(analysisStatus === "analyzing" || analysisStatus === "error") && (
        <div className={`analysis-state-panel visible ${analysisStatus === "error" ? "error" : ""}`} data-testid="analysis-state-panel">
          <div className="loading-spinner" />
          <div>
            <strong>{analysisStatus === "error" ? "Analysis could not finish" : "Analyzing your English writing"}</strong>
            <p>
              {analysisStatus === "error"
                ? "This simulates a temporary AI service issue."
                : "Checking ideas, organization, vocabulary, grammar, sentence fluency, and mechanics."}
            </p>
          </div>
          {analysisStatus === "error" && (
            <button className="secondary-button" data-testid="retry-analysis" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}
      <section className="report-summary-layout">
        <div className="report-main-summary">
          <p className="eyebrow">Writing feedback</p>
          <h2>{report.title}</h2>
          <p>{report.overall}</p>
          <button className="primary-button" onClick={onStartRevision} type="button">
            Start Revision
          </button>
        </div>

        <div className="today-focus-panel">
          <p className="eyebrow">Today&apos;s lesson</p>
          <h3>{report.focus}</h3>
          <p>{focusDimension.note}</p>
          <div className="focus-pair">
            <span>Strength</span>
            <strong>{report.strongest.name}</strong>
          </div>
          <div className="focus-pair">
            <span>Practice next</span>
            <strong>{report.weakest.name}</strong>
          </div>
        </div>
      </section>

      <section className="panel skills-snapshot-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Writing skills</p>
            <h3>Quick snapshot</h3>
          </div>
        </div>
        <div className="skills-snapshot-grid" data-testid="rubric-grid">
          {report.dimensions.map((dimension) => (
            <article key={dimension.key} className={dimension.name === report.focus ? "active" : ""}>
              <div>
                <strong>{dimension.name}</strong>
                <span>{dimension.level}</span>
              </div>
              <div className="score-meter compact">
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={index} className={index < dimension.score ? "filled" : ""} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="report-workspace-grid">
        <TeacherMarkedDraft draft={draft} report={report} />

        <div className="coach-stack">
          <section className="panel coach-panel">
            <p className="eyebrow">What already works</p>
            <h3>Strong moments</h3>
            {report.highlightSentences.length > 0 ? (
              <div className="highlight-list">
                {report.highlightSentences.map((highlight, index) => (
                  <article key={`${highlight.text}-${index}`}>
                    <blockquote>{highlight.text}</blockquote>
                    <p>{highlight.reason}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p>Start by choosing one sentence you like from your draft.</p>
            )}
          </section>

          <section className="panel coach-panel">
            <p className="eyebrow">Revision Coach</p>
            <h3>One clear target</h3>
            <div className="revision-suggestion-list">
              {report.revisionSuggestions.map((suggestion) => (
                <article key={`${suggestion.priority}-${suggestion.target}`}>
                  <span>{suggestion.priority}</span>
                  <div>
                    <strong>{suggestion.target}</strong>
                    <p>{suggestion.suggestion}</p>
                    <em>{suggestion.prompt}</em>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel coach-panel">
            <p className="eyebrow">Practice</p>
            <h3>Small next step</h3>
            <div className="next-exercise-list">
              {report.nextExercises.map((exercise) => (
                <article key={exercise.title}>
                  <strong>{exercise.title}</strong>
                  <p>{exercise.instruction}</p>
                  <span>{exercise.minutes} min - {exercise.difficulty}</span>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}

