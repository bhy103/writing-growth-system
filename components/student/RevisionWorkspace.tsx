import { type ChangeEvent, useEffect } from "react";
import { type RevisionSaveStatus } from "@/hooks/useWritingPrototypeState";
import { suggestRevision } from "@/lib/mock/mock-analysis";

type RevisionWorkspaceProps = {
  draft: string;
  revisedDraft: string;
  saveStatus: RevisionSaveStatus;
  saveMessage: string;
  onRevisedDraftChange: (value: string) => void;
  onSaveRevision: () => void;
};

export function RevisionWorkspace({
  draft,
  revisedDraft,
  saveStatus,
  saveMessage,
  onRevisedDraftChange,
  onSaveRevision,
}: RevisionWorkspaceProps) {
  const isSaving = saveStatus === "saving";

  useEffect(() => {
    if (!revisedDraft) {
      onRevisedDraftChange(suggestRevision(draft));
    }
  }, [draft, onRevisedDraftChange, revisedDraft]);

  return (
    <section className="view active-view" data-testid="view-revision">
      <section className="revision-layout">
        <div className="panel">
          <h3>Original Draft</h3>
          <p className="draft-text">{draft}</p>
        </div>
        <div className="panel editor-panel">
          <h3>Revised Draft</h3>
          <textarea
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
