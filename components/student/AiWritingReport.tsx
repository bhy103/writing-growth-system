import { type MockReport } from "@/lib/mock/mock-analysis";

type AiWritingReportProps = {
  report: MockReport;
  analysisStatus: "idle" | "analyzing" | "error" | "ready";
  onRetry: () => void;
  onStartRevision: () => void;
};

export function AiWritingReport({ report, analysisStatus, onRetry, onStartRevision }: AiWritingReportProps) {
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
      <div className="report-header">
        <div>
          <p className="eyebrow">AI Writing Report</p>
          <h2>{report.title}</h2>
          <p>{report.overall}</p>
        </div>
        <button className="primary-button" onClick={onStartRevision} type="button">
          Start Revision
        </button>
      </div>
      <div className="rubric-grid" data-testid="rubric-grid">
        {report.dimensions.map((dimension) => (
          <article key={dimension.key} className={`rubric-card ${dimension.level === "Focus" ? "focus" : ""}`}>
            <span>{dimension.name}</span>
            <strong>{dimension.level}</strong>
            <div className="score-meter">
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} className={index < dimension.score ? "filled" : ""} />
              ))}
            </div>
            <p>{dimension.note}</p>
          </article>
        ))}
      </div>

      <div className="coach-report-grid">
        <section className="panel coach-panel">
          <p className="eyebrow">What already works</p>
          <h3>Strong writing moments</h3>
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
          <h3>Practice one clear target</h3>
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
          <p className="eyebrow">Next Exercise</p>
          <h3>Small practice task</h3>
          <div className="next-exercise-list">
            {report.nextExercises.map((exercise) => (
              <article key={exercise.title}>
                <strong>{exercise.title}</strong>
                <p>{exercise.instruction}</p>
                <span>{exercise.minutes} min · {exercise.difficulty}</span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
