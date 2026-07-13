import Link from "next/link";
import { type AnalysisStatus, type DraftSaveStatus } from "@/hooks/useWritingPrototypeState";
import { type MockReport } from "@/lib/mock/mock-analysis";
import { type PrototypeHistoryItem } from "@/lib/storage/prototype-storage";
import { type UploadMethod } from "@/lib/upload/upload-source";
import { NewWritingSubmission } from "./NewWritingSubmission";

type StudentDashboardProps = {
  analysisStatus: AnalysisStatus;
  draft: string;
  history: PrototypeHistoryItem[];
  report: MockReport;
  saveMessage: string;
  saveStatus: DraftSaveStatus;
  title: string;
  onAnalyzeWriting: () => void;
  onDraftChange: (value: string) => void;
  onOpenRevision: () => void;
  onSaveDraft: () => void;
  onTitleChange: (value: string) => void;
  onUploadFile: (method: UploadMethod, file: File) => void;
};

export function StudentDashboard({
  analysisStatus,
  draft,
  history,
  report,
  saveMessage,
  saveStatus,
  title,
  onAnalyzeWriting,
  onDraftChange,
  onOpenRevision,
  onSaveDraft,
  onTitleChange,
  onUploadFile,
}: StudentDashboardProps) {
  const latestHistory = history.slice(0, 4);

  return (
    <section className="view active-view" data-testid="view-dashboard">
      <div className="hero-band">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Build one stronger English draft.</h2>
          <p>Submit writing, review AI feedback, revise, and track progress from one workspace.</p>
        </div>
        <a className="primary-button large" href="#new-writing-panel">
          Start
        </a>
      </div>

      <div className="dashboard-grid">
        <section className="panel dashboard-card">
          <p className="eyebrow">AI Report</p>
          <h3>{report.title || "No report yet"}</h3>
          <div className="dashboard-report-grid">
            <div>
              <span>Current focus</span>
              <strong>{report.focus}</strong>
            </div>
            <div>
              <span>Strongest skill</span>
              <strong>{report.strongest.name}</strong>
            </div>
          </div>
          <p>{report.weakest.note}</p>
          <div className="button-row">
            <Link className="secondary-button" href="/workspace/report">
              Open report
            </Link>
            <button className="primary-button" onClick={onOpenRevision} type="button">
              Revise draft
            </button>
          </div>
        </section>

        <section className="panel dashboard-card">
          <p className="eyebrow">History & Revision</p>
          <h3>Recent writing</h3>
          {latestHistory.length > 0 ? (
            <div className="dashboard-history-list">
              {latestHistory.map((item) => (
                <Link href={item.id ? `/workspace/history/${item.id}` : "/workspace/history"} key={item.id ?? item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.status} · {item.focus}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p>No writing saved yet.</p>
          )}
          <Link className="secondary-button" href="/workspace/history">
            View all history
          </Link>
        </section>
      </div>

      <div id="new-writing-panel" className="dashboard-writing-panel">
        <NewWritingSubmission
          analysisStatus={analysisStatus}
          draft={draft}
          onAnalyzeWriting={onAnalyzeWriting}
          onDraftChange={onDraftChange}
          onSaveDraft={onSaveDraft}
          onTitleChange={onTitleChange}
          onUploadFile={onUploadFile}
          saveMessage={saveMessage}
          saveStatus={saveStatus}
          title={title}
        />
      </div>
    </section>
  );
}
