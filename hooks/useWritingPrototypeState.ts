"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createMockReport,
  createParentSummary,
  type MockReport,
} from "@/lib/mock/mock-analysis";
import { extractionMeta } from "@/lib/mock/mock-data";
import {
  clearPrototypeSnapshot,
  defaultPrototypeSnapshot,
  loadPrototypeSnapshot,
  savePrototypeSnapshot,
  type PrototypeSnapshot,
} from "@/lib/storage/prototype-storage";
import { type UploadedSource, type UploadMethod } from "@/lib/upload/upload-source";
import { type View, viewRoutes } from "@/lib/workflow/writing-flow";

export type AnalysisStatus = "idle" | "analyzing" | "error" | "ready";
export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

function getInitialSnapshot() {
  if (typeof window === "undefined") {
    return defaultPrototypeSnapshot;
  }

  return loadPrototypeSnapshot();
}

export function useWritingPrototypeState(initialView: View = "dashboard") {
  const router = useRouter();
  const [view, setView] = useState<View>(initialView);
  const [snapshot, setSnapshot] = useState<PrototypeSnapshot>(() => getInitialSnapshot());
  const [report, setReport] = useState<MockReport>(() => {
    const initialSnapshot = getInitialSnapshot();
    return createMockReport({ title: initialSnapshot.title, draft: initialSnapshot.draft });
  });
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("image");
  const [uploadedSource, setUploadedSource] = useState<UploadedSource | null>(null);
  const [lowConfidence, setLowConfidence] = useState(false);
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [draftSaveMessage, setDraftSaveMessage] = useState("");
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(
    initialView === "report" ? "ready" : "idle",
  );

  const parentSummary = useMemo(() => createParentSummary(report), [report]);
  const currentMeta = lowConfidence
    ? { confidence: "58%", state: "Low confidence - review carefully" }
    : extractionMeta[uploadMethod];

  useEffect(() => {
    savePrototypeSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (view !== "history") {
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      const response = await fetch("/api/submissions");

      if (!response.ok) {
        return;
      }

      const result = await response.json();

      if (cancelled || !Array.isArray(result.submissions)) {
        return;
      }

      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        history: result.submissions.map((submission: { title: string; status: string; focus: string }) => ({
          title: submission.title,
          status: titleCaseStatus(submission.status),
          focus: submission.focus,
        })),
      }));
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [view]);

  function titleCaseStatus(status: string) {
    return status
      .toLowerCase()
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function setTitle(title: string) {
    setSnapshot((currentSnapshot) => ({ ...currentSnapshot, title }));
  }

  function setDraft(draft: string) {
    setSnapshot((currentSnapshot) => ({ ...currentSnapshot, draft }));
  }

  function openReport() {
    setReport(createMockReport({ title: snapshot.title, draft: snapshot.draft }));
    setView("report");
    setAnalysisStatus("ready");
    router.push(viewRoutes.report);
  }

  function simulateFailure() {
    setView("report");
    setAnalysisStatus("error");
    router.push(viewRoutes.report);
  }

  function openUpload(method: UploadMethod, file: File) {
    setUploadMethod(method);
    setUploadedSource({ method, file });
    setLowConfidence(method === "photo");
    setView("upload-review");
    router.push(viewRoutes["upload-review"]);
  }

  function confirmUploadedText(text: string) {
    const nextSnapshot = { ...snapshot, draft: text };
    setSnapshot(nextSnapshot);
    savePrototypeSnapshot(nextSnapshot);
    setView("new-writing");
    router.push(viewRoutes["new-writing"]);
  }

  async function saveDraft() {
    setDraftSaveStatus("saving");
    setDraftSaveMessage("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: snapshot.title,
          content: snapshot.draft,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save this draft.");
      }

      setDraftSaveStatus("saved");
      setDraftSaveMessage("Saved to workspace history.");
    } catch (error) {
      setDraftSaveStatus("error");
      setDraftSaveMessage(error instanceof Error ? error.message : "Unable to save this draft.");
      return;
    }

    const nextSnapshot = {
      ...snapshot,
      history: [{ title: snapshot.title, status: "Draft", focus: "Not analyzed" }, ...snapshot.history],
    };
    setSnapshot(nextSnapshot);
    savePrototypeSnapshot(nextSnapshot);
    setView("history");
    router.push(viewRoutes.history);
  }

  function saveRevision() {
    const nextSnapshot = {
      ...snapshot,
      history: [{ title: snapshot.title, status: "Revised", focus: report.weakest.name }, ...snapshot.history],
    };
    setSnapshot(nextSnapshot);
    savePrototypeSnapshot(nextSnapshot);
    setView("parent");
    router.push(viewRoutes.parent);
  }

  function openRevision() {
    setView("revision");
    router.push(viewRoutes.revision);
  }

  function chooseAnotherUpload() {
    setView("new-writing");
    router.push(viewRoutes["new-writing"]);
  }

  function openSavedReport() {
    setView("report");
    router.push(viewRoutes.report);
  }

  function resetPrototypeData() {
    clearPrototypeSnapshot();
    setSnapshot(defaultPrototypeSnapshot);
    setReport(
      createMockReport({
        title: defaultPrototypeSnapshot.title,
        draft: defaultPrototypeSnapshot.draft,
      }),
    );
    setAnalysisStatus("idle");
    setLowConfidence(false);
    setUploadMethod("image");
    setUploadedSource(null);
    setView("dashboard");
    router.push(viewRoutes.dashboard);
  }

  return {
    view,
    setView,
    title: snapshot.title,
    setTitle,
    draft: snapshot.draft,
    setDraft,
    history: snapshot.history,
    draftSaveStatus,
    draftSaveMessage,
    report,
    uploadMethod,
    uploadedSource,
    lowConfidence,
    setLowConfidence,
    analysisStatus,
    parentSummary,
    currentMeta,
    openReport,
    simulateFailure,
    openUpload,
    confirmUploadedText,
    saveDraft,
    saveRevision,
    openRevision,
    chooseAnotherUpload,
    openSavedReport,
    resetPrototypeData,
  };
}
