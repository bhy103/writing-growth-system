import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell/AppShell";
import { requireCurrentStudentProfile } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";

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
            <Link className="secondary-button" href={`/workspace/new-writing?submissionId=${submission.id}`}>
              {analysis ? "Analyze again" : "Analyze this writing"}
            </Link>
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
            <Link className="primary-button detail-action" href={`/workspace/new-writing?submissionId=${submission.id}`}>
              Analyze from writing workspace
            </Link>
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
