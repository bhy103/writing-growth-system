import Link from "next/link";
import { type ChangeEvent } from "react";

type NewWritingSubmissionProps = {
  title: string;
  draft: string;
  onTitleChange: (value: string) => void;
  onDraftChange: (value: string) => void;
};

export function NewWritingSubmission({
  title,
  draft,
  onTitleChange,
  onDraftChange,
}: NewWritingSubmissionProps) {
  return (
    <section className="view active-view" data-testid="view-new-writing">
      <div className="layout-stack">
        <section className="panel">
          <p className="eyebrow">Submission</p>
          <h3>Choose how to submit English writing</h3>
          <div className="submission-grid">
            <Link className="submission-option selected" data-testid="submission-typed" href="/workspace/new-writing">
              <span className="option-icon">T</span>
              <strong>Type directly</strong>
              <small>Available in first MVP</small>
            </Link>
            <Link className="submission-option placeholder" data-testid="submission-photo" href="/workspace/upload-review">
              <span className="option-icon">C</span>
              <strong>Take photo</strong>
              <small>Open review frame</small>
            </Link>
            <Link className="submission-option placeholder" data-testid="submission-image" href="/workspace/upload-review">
              <span className="option-icon">I</span>
              <strong>Upload image</strong>
              <small>Open review frame</small>
            </Link>
            <Link className="submission-option placeholder" data-testid="submission-document" href="/workspace/upload-review">
              <span className="option-icon">D</span>
              <strong>Upload document</strong>
              <small>Open review frame</small>
            </Link>
          </div>
        </section>

        <section className="editor-layout">
          <div className="panel editor-panel">
            <label htmlFor="writing-title">Title</label>
            <input
              id="writing-title"
              value={title}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onTitleChange(event.target.value)}
            />
            <label htmlFor="writing-draft">English draft</label>
            <textarea
              id="writing-draft"
              value={draft}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onDraftChange(event.target.value)}
            />
            <div className="button-row">
              <Link className="secondary-button" data-testid="save-draft" href="/workspace/history">
                Save Draft
              </Link>
              <Link className="secondary-button" data-testid="simulate-analysis-failure" href="/workspace/report">
                Preview Report
              </Link>
              <Link className="primary-button" data-testid="analyze-writing" href="/workspace/report">
                Analyze Writing
              </Link>
            </div>
          </div>
          <aside className="panel guidance-panel">
            <h3>Writing Coach</h3>
            <p>Keep the first draft in your own words. The report will help you improve the English draft.</p>
          </aside>
        </section>
      </div>
    </section>
  );
}
