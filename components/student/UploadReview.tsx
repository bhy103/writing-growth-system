import { useEffect, useMemo, useRef, useState } from "react";
import { type DraftSaveStatus } from "@/hooks/useWritingPrototypeState";
import { formatFileSize, type UploadedSource } from "@/lib/upload/upload-source";

type UploadMethod = "photo" | "image" | "document";

type UploadReviewProps = {
  uploadMethod: UploadMethod;
  uploadedSource: UploadedSource | null;
  uploadTitle: string;
  uploadSaveStatus: DraftSaveStatus;
  uploadSaveMessage: string;
  onUploadTitleChange: (title: string) => void;
  onChooseAnother: () => void;
  onSaveUploadedSource: (confirmed?: { content?: string; title?: string }) => void;
};

export function UploadReview({
  uploadMethod,
  uploadedSource,
  uploadTitle,
  uploadSaveStatus,
  uploadSaveMessage,
  onUploadTitleChange,
  onChooseAnother,
  onSaveUploadedSource,
}: UploadReviewProps) {
  const [recognizedText, setRecognizedText] = useState("");
  const [extractStatus, setExtractStatus] = useState<"idle" | "reading" | "ready" | "error">("idle");
  const [extractMessage, setExtractMessage] = useState("");
  const uploadTitleRef = useRef(uploadTitle);
  const isImageSource =
    uploadedSource?.file.type.startsWith("image/") || uploadMethod === "photo" || uploadMethod === "image";
  const methodLabel = {
    photo: "Photo",
    image: "Image",
    document: "Document",
  }[uploadMethod];
  const previewUrl = useMemo(() => {
    if (!uploadedSource || !isImageSource) {
      return "";
    }

    return URL.createObjectURL(uploadedSource.file);
  }, [isImageSource, uploadedSource]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    uploadTitleRef.current = uploadTitle;
  }, [uploadTitle]);

  useEffect(() => {
    let cancelled = false;

    async function extractUploadText() {
      if (!uploadedSource) {
        return;
      }

      setRecognizedText("");
      setExtractStatus("reading");
      setExtractMessage("Reading the uploaded writing...");

      try {
        const formData = new FormData();
        formData.set("file", uploadedSource.file);
        const response = await fetch("/api/uploads/extract", {
          method: "POST",
          body: formData,
        });
        const result = (await response.json().catch(() => ({}))) as {
          content?: string;
          message?: string;
          title?: string;
        };

        if (!response.ok) {
          throw new Error(result.message ?? "AI could not read this upload yet.");
        }

        if (cancelled) {
          return;
        }

        setRecognizedText(result.content ?? "");
        if (!uploadTitleRef.current.trim() && result.title) {
          onUploadTitleChange(result.title);
        }
        setExtractStatus("ready");
        setExtractMessage("Check the recognised text before analysis.");
      } catch (error) {
        if (cancelled) {
          return;
        }

        setExtractStatus("error");
        setExtractMessage(error instanceof Error ? error.message : "AI could not read this upload yet.");
      }
    }

    void extractUploadText();

    return () => {
      cancelled = true;
    };
  }, [onUploadTitleChange, uploadedSource]);

  const wordCount = recognizedText.trim() ? recognizedText.trim().split(/\s+/).length : 0;
  const canConfirm = Boolean(uploadedSource && recognizedText.trim() && uploadSaveStatus !== "saving");

  return (
    <section className="view active-view" data-testid="view-upload-review">
      <section className="upload-review-hero">
        <p className="eyebrow">Check your writing</p>
        <h2>Review the recognised text</h2>
        <p>AI reads the upload first. Fix OCR mistakes only, then confirm analysis.</p>
      </section>
      <section className="upload-review-layout">
        <div className="panel upload-preview-panel">
          <p className="eyebrow">Original upload</p>
          <h3>{methodLabel} file</h3>
          <div className="source-preview">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Selected writing source preview" />
            ) : (
              <span>{uploadMethod[0].toUpperCase()}</span>
            )}
            <strong>{uploadedSource?.file.name ?? `${uploadMethod} file`}</strong>
            <small>
              {uploadedSource
                ? `${uploadedSource.file.type || "Unknown type"} - ${formatFileSize(uploadedSource.file.size)}`
              : "Source preview frame"}
            </small>
          </div>
        </div>
        <div className="panel recognised-text-panel">
          <div className="recognised-panel-header">
            <div>
              <p className="eyebrow">Recognised text</p>
              <h3>Editable draft</h3>
            </div>
            <span>{wordCount} words</span>
          </div>
          <label htmlFor="upload-title">Title optional</label>
          <input
            id="upload-title"
            onChange={(event) => onUploadTitleChange(event.target.value)}
            placeholder="Leave blank to auto-title this upload"
            value={uploadTitle}
          />
          <textarea
            className="recognised-textarea"
            disabled={extractStatus === "reading"}
            onChange={(event) => setRecognizedText(event.target.value)}
            placeholder={
              extractStatus === "reading"
                ? "Reading the uploaded writing..."
                : "Type or correct the recognised writing here."
            }
            value={recognizedText}
          />
          {extractMessage && (
            <p className={`form-message ${extractStatus === "error" ? "error" : "success"}`}>{extractMessage}</p>
          )}
          {!uploadedSource && <p className="form-message error">Please choose a source file from New Writing.</p>}
          {uploadSaveMessage && (
            <p className={`form-message ${uploadSaveStatus === "error" ? "error" : "success"}`}>
              {uploadSaveMessage}
            </p>
          )}
          <div className="button-row">
            <button className="secondary-button" onClick={onChooseAnother} type="button">
              Choose another
            </button>
            <button
              className="primary-button"
              data-testid="save-uploaded-source"
              disabled={!canConfirm}
              onClick={() => onSaveUploadedSource({ content: recognizedText, title: uploadTitle })}
              type="button"
            >
              {uploadSaveStatus === "saving" ? "Analyzing..." : "Confirm & analyse ->"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
