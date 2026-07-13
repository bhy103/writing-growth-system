import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { AnalyzeSubmissionButton } from "@/components/student/AnalyzeSubmissionButton";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import { formatFileSize } from "@/lib/upload/upload-source";

type WritingDetailPageProps = {
  params: Promise<{
    submissionId: string;
  }>;
};

function titleCaseStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function isEnglishOnlySummary(summary?: string | null) {
  return Boolean(summary && !/[\u3400-\u9fff]/.test(summary));
}

export default async function WritingDetailPage({ params }: WritingDetailPageProps) {
  const { submissionId } = await params;
  const student = await requireCurrentStudentProfile();
  const submission = await getPrisma().writingSubmission.findFirst({
    where: {
      id: submissionId,
      studentId: student.id,
    },
    include: {
      analysis: true,
      uploads: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      revisions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  const analysis = submission.analysis;
  const sourceUpload = submission.uploads[0];
  const hasStoredSourceFile = sourceUpload && !sourceUpload.storagePath.startsWith("pending-storage/");
  const hasPendingSourceFile = sourceUpload && sourceUpload.storagePath.startsWith("pending-storage/");
  const canAnalyze = Boolean(submission.content?.trim() || hasStoredSourceFile);

  return (
    <AppShell activeView="history">
      <section className="writing-detail-page">
        <div className="detail-header">
          <div>
            <Link className="back-link" href="/workspace/history">
              Back to history
            </Link>
            <h2>{submission.title}</h2>
            <div className="detail-meta">
              <span>{titleCaseStatus(submission.status)}</span>
              <span>{analysis?.focusDimension ?? "Not analyzed"}</span>
              <span>{formatDate(submission.createdAt)}</span>
            </div>
          </div>
          <div className="detail-actions">
            {analysis && (
              <Link className="secondary-button" href={`/workspace/report?submissionId=${submission.id}`}>
                View full report
              </Link>
            )}
            <AnalyzeSubmissionButton
              disabled={!canAnalyze}
              label={analysis ? "Analyze again" : "Analyze this writing"}
              submissionId={submission.id}
            />
            <Link className="primary-button" href={`/workspace/revision?submissionId=${submission.id}`}>
              Revise this writing
            </Link>
          </div>
        </div>

        <div className="detail-grid">
          <section className="panel detail-section">
            <p className="section-eyebrow">Original Draft</p>
            <div className="draft-readout">{submission.content || "No draft content saved."}</div>
          </section>

          <aside className="panel detail-section">
            <p className="section-eyebrow">Writing Status</p>
            <dl className="detail-facts">
              <div>
                <dt>Student</dt>
                <dd>{student.displayName}</dd>
              </div>
              <div>
                <dt>Focus</dt>
                <dd>{analysis?.focusDimension ?? "Not analyzed"}</dd>
              </div>
              <div>
                <dt>Level</dt>
                <dd>{analysis?.overallLevel ?? "Pending"}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{sourceUpload ? sourceUpload.fileName : "Typed text"}</dd>
              </div>
              {sourceUpload && (
                <div>
                  <dt>File details</dt>
                  <dd>
                    {sourceUpload.fileType} {sourceUpload.fileSize ? `- ${formatFileSize(sourceUpload.fileSize)}` : ""}
                  </dd>
                </div>
              )}
              {hasStoredSourceFile && (
                <div>
                  <dt>Original file</dt>
                  <dd>
                    <Link className="inline-link" href={`/api/uploads/${sourceUpload.id}/download`} target="_blank">
                      Open source file
                    </Link>
                  </dd>
                </div>
              )}
              {hasPendingSourceFile && (
                <div>
                  <dt>Original file</dt>
                  <dd>File storage pending. Please check Supabase Storage settings.</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        {analysis ? (
          <section className="panel detail-section">
            <p className="section-eyebrow">AI Writing Report</p>
            <div className="report-summary-grid">
              <div>
                <strong>Strongest skill</strong>
                <span>{analysis.strongestDimension ?? "Not available"}</span>
              </div>
              <div>
                <strong>Practice next</strong>
                <span>{analysis.weakestDimension ?? "Not available"}</span>
              </div>
            </div>
            <p className="detail-copy">{analysis.studentFeedback ?? "No student feedback saved yet."}</p>
            {isEnglishOnlySummary(analysis.parentSummaryZh) && (
              <div className="parent-summary-note">
                <strong>Family summary</strong>
                <p>{analysis.parentSummaryZh}</p>
              </div>
            )}
          </section>
        ) : (
          <section className="panel detail-section">
            <p className="section-eyebrow">AI Writing Report</p>
            <p className="detail-copy">This draft has not been analyzed yet.</p>
            <AnalyzeSubmissionButton
              disabled={!canAnalyze}
              label={canAnalyze ? "Analyze now" : "Upload a clearer file or add draft text"}
              submissionId={submission.id}
            />
          </section>
        )}

        <section className="panel detail-section">
          <p className="section-eyebrow">Revision History</p>
          {submission.revisions.length > 0 ? (
            <div className="revision-list">
              {submission.revisions.map((revision) => (
                <article className="revision-item" key={revision.id}>
                  <div>
                    <strong>{formatDate(revision.createdAt)}</strong>
                    {revision.note && <span>{revision.note}</span>}
                  </div>
                  <p>{revision.content}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="detail-copy">No revisions saved yet.</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}
