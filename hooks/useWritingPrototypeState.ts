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

  function saveDraft() {
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
