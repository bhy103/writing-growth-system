import Link from "next/link";
import { useEffect, useMemo } from "react";
import { sampleExtractedText } from "@/lib/mock/mock-data";
import { formatFileSize, type UploadedSource } from "@/lib/upload/upload-source";

type UploadMethod = "photo" | "image" | "document";

type UploadReviewProps = {
  uploadMethod: UploadMethod;
  uploadedSource: UploadedSource | null;
  confidence: string;
  state: string;
  lowConfidence: boolean;
  onChooseAnother: () => void;
  onMarkLowConfidence: () => void;
  onConfirmText: (text: string) => void;
};

export function UploadReview({
  uploadMethod,
  uploadedSource,
  confidence,
  state,
  lowConfidence,
  onMarkLowConfidence,
}: UploadReviewProps) {
  const extractedText = sampleExtractedText[uploadMethod];
  const isImageSource =
    uploadedSource?.file.type.startsWith("image/") || uploadMethod === "photo" || uploadMethod === "image";
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
          <h3>{uploadMethod} review</h3>
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
          <p className="eyebrow">Text review</p>
          <h3>Confirm extracted English text</h3>
          <div className={`review-status ${lowConfidence ? "low-confidence" : ""}`}>
            <span>Extraction confidence: {confidence}</span>
            <strong>{state}</strong>
          </div>
          {lowConfidence && (
            <div className="review-warning visible">Low-confidence text should be checked carefully.</div>
          )}
          <textarea className="review-textarea" value={extractedText} readOnly />
          <div className="button-row">
            <Link className="secondary-button" href="/workspace/new-writing">
              Choose another
            </Link>
            <button className="secondary-button" data-testid="mark-low-confidence" onClick={onMarkLowConfidence}>
              Mark low confidence
            </button>
            <Link className="primary-button" data-testid="confirm-review-text" href="/workspace/new-writing">
              Confirm Text
            </Link>
          </div>
        </div>
      </section>
    </section>
  );
}
