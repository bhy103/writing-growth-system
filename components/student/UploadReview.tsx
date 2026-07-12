import Link from "next/link";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
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
  onConfirmText,
}: UploadReviewProps) {
  const extractedText = sampleExtractedText[uploadMethod];
  const [reviewText, setReviewText] = useState(extractedText);
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
          <p className="panel-note">Review and edit the text before sending it to the writing workspace.</p>
          <div className={`review-status ${lowConfidence ? "low-confidence" : ""}`}>
            <span>Extraction confidence: {confidence}</span>
            <strong>{state}</strong>
          </div>
          {lowConfidence && (
            <div className="review-warning visible">Low-confidence text should be checked carefully.</div>
          )}
          <textarea
            className="review-textarea"
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReviewText(event.target.value)}
            value={reviewText}
          />
          <div className="button-row">
            <Link className="secondary-button" href="/workspace/new-writing">
              Choose another
            </Link>
            <button className="secondary-button" data-testid="mark-low-confidence" onClick={onMarkLowConfidence}>
              Mark low confidence
            </button>
            <button
              className="primary-button"
              data-testid="confirm-review-text"
              onClick={() => onConfirmText(reviewText)}
              type="button"
            >
              Confirm Text
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}
