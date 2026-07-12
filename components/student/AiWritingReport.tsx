import Link from "next/link";
import { type MockReport } from "@/lib/mock/mock-analysis";

type AiWritingReportProps = {
  report: MockReport;
  analysisStatus: "idle" | "analyzing" | "error" | "ready";
  onRetry: () => void;
  onStartRevision: () => void;
};

export function AiWritingReport({ report, analysisStatus, onRetry }: AiWritingReportProps) {
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
        <Link className="primary-button" href="/workspace/revision">
          Start Revision
        </Link>
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
    </section>
  );
}
