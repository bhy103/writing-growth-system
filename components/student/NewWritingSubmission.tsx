import { type ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { type AnalysisStatus, type DraftSaveStatus } from "@/hooks/useWritingPrototypeState";
import { documentAccept, type UploadMethod, validateUploadFile } from "@/lib/upload/upload-source";

type NewWritingSubmissionProps = {
  title: string;
  draft: string;
  saveStatus: DraftSaveStatus;
  analysisStatus: AnalysisStatus;
  saveMessage: string;
  onTitleChange: (value: string) => void;
  onDraftChange: (value: string) => void;
  onSaveDraft: () => void;
  onAnalyzeWriting: () => void;
  onUploadFile: (method: UploadMethod, file: File) => void;
};

export function NewWritingSubmission({
  title,
  draft,
  saveStatus,
  analysisStatus,
  saveMessage,
  onTitleChange,
  onDraftChange,
  onSaveDraft,
  onAnalyzeWriting,
  onUploadFile,
}: NewWritingSubmissionProps) {
  const isSaving = saveStatus === "saving";
  const isAnalyzing = analysisStatus === "analyzing";
  const photoInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");

  function chooseFile(method: UploadMethod) {
    setUploadError("");

    if (method === "photo") {
      photoInputRef.current?.click();
      return;
    }

    if (method === "image") {
      imageInputRef.current?.click();
      return;
    }

    documentInputRef.current?.click();
  }

  function handleFileChange(method: UploadMethod, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError = validateUploadFile(method, file);

    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadError("");
    onUploadFile(method, file);
  }

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
            <button
              className="submission-option placeholder"
              data-testid="submission-photo"
              onClick={() => chooseFile("photo")}
              type="button"
            >
              <span className="option-icon">C</span>
              <strong>Take photo</strong>
              <small>Choose a camera image</small>
            </button>
            <button
              className="submission-option placeholder"
              data-testid="submission-image"
              onClick={() => chooseFile("image")}
              type="button"
            >
              <span className="option-icon">I</span>
              <strong>Upload image</strong>
              <small>Choose JPG, PNG, WebP, or HEIC</small>
            </button>
            <button
              className="submission-option placeholder"
              data-testid="submission-document"
              onClick={() => chooseFile("document")}
              type="button"
            >
              <span className="option-icon">D</span>
              <strong>Upload document</strong>
              <small>Choose PDF, Word, or TXT</small>
            </button>
          </div>
          <input
            ref={photoInputRef}
            accept="image/*"
            capture="environment"
            className="visually-hidden-file"
            onChange={(event) => handleFileChange("photo", event)}
            type="file"
          />
          <input
            ref={imageInputRef}
            accept="image/*"
            className="visually-hidden-file"
            onChange={(event) => handleFileChange("image", event)}
            type="file"
          />
          <input
            ref={documentInputRef}
            accept={documentAccept}
            className="visually-hidden-file"
            onChange={(event) => handleFileChange("document", event)}
            type="file"
          />
          {uploadError && <p className="form-message error">{uploadError}</p>}
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
              <button
                className="secondary-button"
                data-testid="save-draft"
                disabled={isSaving}
                onClick={onSaveDraft}
                type="button"
              >
                {isSaving ? "Saving..." : "Save Draft"}
              </button>
              <Link className="secondary-button" data-testid="simulate-analysis-failure" href="/workspace/report">
                Preview Report
              </Link>
              <button
                className="primary-button"
                data-testid="analyze-writing"
                disabled={isAnalyzing}
                onClick={onAnalyzeWriting}
                type="button"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze Writing"}
              </button>
            </div>
            {saveMessage && (
              <p className={`form-message ${saveStatus === "error" ? "error" : "success"}`}>
                {saveMessage}
              </p>
            )}
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
