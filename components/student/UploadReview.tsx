import { useEffect, useMemo } from "react";
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
  onSaveUploadedSource: () => void;
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

  return (
    <section className="view active-view" data-testid="view-upload-review">
      <section className="upload-review-layout">
        <div className="panel upload-preview-panel">
          <p className="eyebrow">Source file</p>
          <h3>{methodLabel} submission</h3>
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
        <div className="panel">
          <p className="eyebrow">Submission details</p>
          <h3>Analyze uploaded writing</h3>
          <p className="panel-note">The original file will be saved, then AI will read and analyze the writing.</p>
          <label htmlFor="upload-title">Title optional</label>
          <input
            id="upload-title"
            onChange={(event) => onUploadTitleChange(event.target.value)}
            placeholder="Leave blank to auto-title this upload"
            value={uploadTitle}
          />
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
              disabled={uploadSaveStatus === "saving" || !uploadedSource}
              onClick={onSaveUploadedSource}
              type="button"
            >
              {uploadSaveStatus === "saving" ? "Analyzing..." : "Analyze Upload"}
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
