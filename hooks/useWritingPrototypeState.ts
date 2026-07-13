"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  createMockReport,
  createParentSummary,
  type MockReport,
} from "@/lib/mock/mock-analysis";
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
export type RevisionSaveStatus = "idle" | "saving" | "saved" | "error";

function getInitialSnapshot() {
  if (typeof window === "undefined") {
    return defaultPrototypeSnapshot;
  }

  return loadPrototypeSnapshot();
}

function getNextLocalUntitledTitle(history: PrototypeSnapshot["history"]) {
  const usedNumbers = history
    .map((item) => item.title.match(/^Untitled (\d+)$/i)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value));
  const nextNumber = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;

  return `Untitled ${String(nextNumber).padStart(2, "0")}`;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: "Server returned an unreadable response. Please check deployment logs.",
    };
  }
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
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadSaveStatus, setUploadSaveStatus] = useState<DraftSaveStatus>("idle");
  const [uploadSaveMessage, setUploadSaveMessage] = useState("");
  const [draftSaveStatus, setDraftSaveStatus] = useState<DraftSaveStatus>("idle");
  const [draftSaveMessage, setDraftSaveMessage] = useState("");
  const [revisionDraft, setRevisionDraft] = useState("");
  const [revisionSaveStatus, setRevisionSaveStatus] = useState<RevisionSaveStatus>("idle");
  const [revisionSaveMessage, setRevisionSaveMessage] = useState("");
  const [currentSubmissionId, setCurrentSubmissionId] = useState<string | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(
    initialView === "report" ? "ready" : "idle",
  );

  const parentSummary = useMemo(() => createParentSummary(report), [report]);

  useEffect(() => {
    savePrototypeSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      (initialView !== "new-writing" && initialView !== "revision" && initialView !== "report")
    ) {
      return;
    }

    const submissionId = new URLSearchParams(window.location.search).get("submissionId");

    if (!submissionId || submissionId === currentSubmissionId) {
      return;
    }

    let cancelled = false;

    async function loadSubmission() {
      const response = await fetch(`/api/submissions/${submissionId}`);

      if (!response.ok) {
        return;
      }

      const result = await readJsonResponse(response);
      const submission = result.submission;

      if (
        cancelled ||
        !submission ||
        typeof submission.id !== "string" ||
        typeof submission.title !== "string" ||
        typeof submission.content !== "string"
      ) {
        return;
      }

      setCurrentSubmissionId(submission.id);
      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        title: submission.title,
        draft: submission.content,
      }));

      if (initialView === "revision" && typeof submission.latestRevision === "string") {
        setRevisionDraft(submission.latestRevision || "");
      }

      if (initialView === "report" && submission.report) {
        setReport(submission.report);
        setAnalysisStatus("ready");
      }
    }

    loadSubmission();

    return () => {
      cancelled = true;
    };
  }, [currentSubmissionId, initialView]);

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

      const result = await readJsonResponse(response);

      if (cancelled || !Array.isArray(result.submissions)) {
        return;
      }

      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        history: result.submissions.map((submission: { id: string; title: string; status: string; focus: string }) => ({
          id: submission.id,
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

  async function openReport() {
    setView("report");
    setAnalysisStatus("analyzing");
    router.push(viewRoutes.report);

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: currentSubmissionId,
          title: snapshot.title,
          content: snapshot.draft,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message ?? "Analysis could not finish.");
      }

      setReport(result.report);
      setCurrentSubmissionId(result.submissionId);
      setAnalysisStatus("ready");
      router.replace(`${viewRoutes.report}?submissionId=${result.submissionId}`);
    } catch {
      setAnalysisStatus("error");
    }
  }

  function simulateFailure() {
    setView("report");
    setAnalysisStatus("error");
    router.push(viewRoutes.report);
  }

  function openUpload(method: UploadMethod, file: File) {
    setUploadMethod(method);
    setUploadedSource({ method, file });
    setUploadTitle("");
    setUploadSaveStatus("idle");
    setUploadSaveMessage("");
    setView("upload-review");
  }

  async function saveUploadedSource() {
    if (!uploadedSource) {
      setUploadSaveStatus("error");
      setUploadSaveMessage("Please choose a source file from New Writing.");
      return;
    }

    const fallbackTitle = getNextLocalUntitledTitle(snapshot.history);
    const requestedTitle = uploadTitle.trim();
    setUploadSaveStatus("saving");
    setUploadSaveMessage("");

    try {
      const formData = new FormData();
      formData.set("title", requestedTitle);
      formData.set("content", "");
      formData.set("uploadMethod", uploadedSource.method);
      formData.set("extractedText", "");
      formData.set("file", uploadedSource.file);

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const result = await readJsonResponse(response);

      if (!response.ok || typeof result.submission?.id !== "string") {
        throw new Error(result.message ?? "Unable to save this upload.");
      }

      const savedSubmissionId = result.submission.id;
      const savedTitle = typeof result.submission.title === "string" ? result.submission.title : requestedTitle || fallbackTitle;
      const extractedText = typeof result.extractedText === "string" ? result.extractedText : "";
      setCurrentSubmissionId(savedSubmissionId);
      setUploadSaveStatus("saved");
      setUploadSaveMessage(
        typeof result.aiWarning === "string"
          ? "Upload saved. AI analysis needs attention before the report can be created."
          : typeof result.uploadWarning === "string"
          ? "Writing record saved. Original file storage still needs configuration."
          : "Upload saved.",
      );

      const nextSnapshot = {
        ...snapshot,
        title: savedTitle,
        draft: extractedText,
        history: [
          {
            id: savedSubmissionId,
            title: savedTitle,
            status: result.report ? "Analyzed" : "Draft",
            focus: result.report?.focus ?? "Source uploaded",
          },
          ...snapshot.history.filter((item) => item.id !== savedSubmissionId),
        ],
      };
      setSnapshot(nextSnapshot);
      savePrototypeSnapshot(nextSnapshot);

      if (result.report) {
        setReport(result.report);
        setAnalysisStatus("ready");
        setView("report");
        router.push(`${viewRoutes.report}?submissionId=${savedSubmissionId}`);
        return;
      }

      router.push(`/workspace/history/${savedSubmissionId}`);
    } catch (error) {
      setUploadSaveStatus("error");
      setUploadSaveMessage(error instanceof Error ? error.message : "Unable to save this upload.");
    }
  }

  async function saveDraft() {
    setDraftSaveStatus("saving");
    setDraftSaveMessage("");
    let savedSubmissionId = "";

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: currentSubmissionId,
          title: snapshot.title,
          content: snapshot.draft,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save this draft.");
      }

      setDraftSaveStatus("saved");
      setDraftSaveMessage("Saved to workspace history.");
      savedSubmissionId = result.submission.id;
      setCurrentSubmissionId(savedSubmissionId);
    } catch (error) {
      setDraftSaveStatus("error");
      setDraftSaveMessage(error instanceof Error ? error.message : "Unable to save this draft.");
      return;
    }

    const nextSnapshot = {
      ...snapshot,
      history: [
        { id: savedSubmissionId, title: snapshot.title, status: "Draft", focus: "Not analyzed" },
        ...snapshot.history.filter((item) => item.id !== savedSubmissionId),
      ],
    };
    setSnapshot(nextSnapshot);
    savePrototypeSnapshot(nextSnapshot);
    setView("history");
    router.push(viewRoutes.history);
  }

  async function saveRevision() {
    setRevisionSaveStatus("saving");
    setRevisionSaveMessage("");
    let savedSubmissionId = "";

    try {
      const response = await fetch("/api/revisions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: currentSubmissionId,
          title: snapshot.title,
          originalContent: snapshot.draft,
          revisedContent: revisionDraft,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "Unable to save this revision.");
      }

      savedSubmissionId = result.submissionId;
      setCurrentSubmissionId(savedSubmissionId);
      setRevisionSaveStatus("saved");
      setRevisionSaveMessage("Revision saved.");
    } catch (error) {
      setRevisionSaveStatus("error");
      setRevisionSaveMessage(error instanceof Error ? error.message : "Unable to save this revision.");
      return;
    }

    const nextSnapshot = {
      ...snapshot,
      draft: revisionDraft,
      history: [
        { id: savedSubmissionId, title: snapshot.title, status: "Completed", focus: report.weakest.name },
        ...snapshot.history,
      ],
    };
    setSnapshot(nextSnapshot);
    savePrototypeSnapshot(nextSnapshot);
    setView("parent");
    router.push(viewRoutes.parent);
  }

  function openRevision() {
    setRevisionDraft((currentRevision) => currentRevision || snapshot.draft);
    setRevisionSaveStatus("idle");
    setRevisionSaveMessage("");
    setView("revision");
    router.push(currentSubmissionId ? `${viewRoutes.revision}?submissionId=${currentSubmissionId}` : viewRoutes.revision);
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
    setUploadMethod("image");
    setUploadedSource(null);
    setUploadTitle("");
    setUploadSaveStatus("idle");
    setUploadSaveMessage("");
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
    revisionDraft,
    setRevisionDraft,
    revisionSaveStatus,
    revisionSaveMessage,
    report,
    uploadMethod,
    uploadedSource,
    uploadTitle,
    setUploadTitle,
    uploadSaveStatus,
    uploadSaveMessage,
    analysisStatus,
    parentSummary,
    openReport,
    simulateFailure,
    openUpload,
    saveUploadedSource,
    saveDraft,
    saveRevision,
    openRevision,
    chooseAnotherUpload,
    openSavedReport,
    resetPrototypeData,
  };
}
