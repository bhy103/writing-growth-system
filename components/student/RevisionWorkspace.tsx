import { type ChangeEvent } from "react";
import { type RevisionSaveStatus } from "@/hooks/useWritingPrototypeState";
import { type MockReport } from "@/lib/mock/mock-analysis";

type RevisionWorkspaceProps = {
  draft: string;
  report: MockReport;
  revisedDraft: string;
  saveStatus: RevisionSaveStatus;
  saveMessage: string;
  onRevisedDraftChange: (value: string) => void;
  onSaveRevision: () => void;
};

export function RevisionWorkspace({
  draft,
  report,
  revisedDraft,
  saveStatus,
  saveMessage,
  onRevisedDraftChange,
  onSaveRevision,
}: RevisionWorkspaceProps) {
  const isSaving = saveStatus === "saving";
  const mainSuggestion = report.revisionSuggestions[0];
  const nextExercise = report.nextExercises[0];

  return (
    <section className="view active-view" data-testid="view-revision">
      <section className="panel revision-coach-panel">
        <p className="eyebrow">Revision Focus</p>
        <div>
          <h3>{report.focus}</h3>
          <p>{mainSuggestion?.suggestion ?? report.weakest.note}</p>
          <strong>{mainSuggestion?.prompt ?? "Revise one sentence using this focus."}</strong>
        </div>
        {nextExercise && (
          <aside>
            <span>Practice task</span>
            <p>{nextExercise.instruction}</p>
          </aside>
        )}
      </section>
      <section className="revision-layout">
        <div className="panel">
          <h3>Original Draft</h3>
          <p className="draft-text">{draft}</p>
        </div>
        <div className="panel editor-panel">
          <h3>Revised Draft</h3>
          <p className="editor-help">Write your own revision below. The AI coach will check whether your change improves the focus.</p>
          <textarea
            placeholder="Revise your draft here in your own words..."
            value={revisedDraft}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onRevisedDraftChange(event.target.value)}
          />
          <button
            className="secondary-button"
            data-testid="save-revision"
            disabled={isSaving}
            onClick={onSaveRevision}
            type="button"
          >
            {isSaving ? "Saving..." : "Save Revision"}
          </button>
          {saveMessage && (
            <p className={`form-message ${saveStatus === "error" ? "error" : "success"}`}>
              {saveMessage}
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
