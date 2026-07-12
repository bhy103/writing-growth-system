"use client";

import { AppShell } from "@/components/app-shell/AppShell";
import { ParentProgressView } from "@/components/parent/ParentProgressView";
import { LanguageSettings } from "@/components/settings/LanguageSettings";
import { AiWritingReport } from "@/components/student/AiWritingReport";
import { NewWritingSubmission } from "@/components/student/NewWritingSubmission";
import { RevisionWorkspace } from "@/components/student/RevisionWorkspace";
import { StudentDashboard } from "@/components/student/StudentDashboard";
import { UploadReview } from "@/components/student/UploadReview";
import { WritingHistory } from "@/components/student/WritingHistory";
import { useWritingPrototypeState } from "@/hooks/useWritingPrototypeState";
import { type View } from "@/lib/workflow/writing-flow";

type WritingGrowthPrototypeProps = {
  initialView?: View;
};

export function WritingGrowthPrototype({ initialView = "dashboard" }: WritingGrowthPrototypeProps) {
  const prototype = useWritingPrototypeState(initialView);

  return (
    <AppShell activeView={prototype.view}>
      {prototype.view === "dashboard" && (
        <StudentDashboard />
      )}

      {prototype.view === "new-writing" && (
        <NewWritingSubmission
          title={prototype.title}
          draft={prototype.draft}
          onTitleChange={prototype.setTitle}
          onDraftChange={prototype.setDraft}
          onSaveDraft={prototype.saveDraft}
          saveStatus={prototype.draftSaveStatus}
          saveMessage={prototype.draftSaveMessage}
        />
      )}

      {prototype.view === "upload-review" && (
        <UploadReview
          uploadMethod={prototype.uploadMethod}
          uploadedSource={prototype.uploadedSource}
          confidence={prototype.currentMeta.confidence}
          state={prototype.currentMeta.state}
          lowConfidence={prototype.lowConfidence}
          onChooseAnother={prototype.chooseAnotherUpload}
          onMarkLowConfidence={() => prototype.setLowConfidence(true)}
          onConfirmText={prototype.confirmUploadedText}
        />
      )}

      {prototype.view === "report" && (
        <AiWritingReport
          report={prototype.report}
          analysisStatus={prototype.analysisStatus}
          onRetry={prototype.openReport}
          onStartRevision={prototype.openRevision}
        />
      )}

      {prototype.view === "revision" && (
        <RevisionWorkspace draft={prototype.draft} onSaveRevision={prototype.saveRevision} />
      )}

      {prototype.view === "history" && (
        <WritingHistory history={prototype.history} onOpenReport={prototype.openSavedReport} />
      )}

      {prototype.view === "parent" && (
        <ParentProgressView report={prototype.report} parentSummary={prototype.parentSummary} />
      )}

      {prototype.view === "settings" && (
        <LanguageSettings onResetPrototypeData={prototype.resetPrototypeData} />
      )}
    </AppShell>
  );
}
