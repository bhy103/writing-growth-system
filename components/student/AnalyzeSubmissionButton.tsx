"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AnalyzeSubmissionButtonProps = {
  disabled?: boolean;
  label: string;
  submissionId: string;
};

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

export function AnalyzeSubmissionButton({ disabled = false, label, submissionId }: AnalyzeSubmissionButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [message, setMessage] = useState("");

  async function analyzeSubmission() {
    setStatus("analyzing");
    setMessage("");

    try {
      const response = await fetch(`/api/submissions/${submissionId}/analyze`, {
        method: "POST",
      });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "AI analysis could not finish.");
      }

      router.push(`/workspace/report?submissionId=${submissionId}`);
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "AI analysis could not finish.");
    }
  }

  return (
    <div className="inline-action-stack">
      <button
        className="secondary-button"
        disabled={disabled || status === "analyzing"}
        onClick={analyzeSubmission}
        type="button"
      >
        {status === "analyzing" ? "Analyzing..." : label}
      </button>
      {message && <p className="form-error compact-error">{message}</p>}
    </div>
  );
}
