"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExtractSubmissionButtonProps = {
  disabled?: boolean;
  label?: string;
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

export function ExtractSubmissionButton({
  disabled = false,
  label = "Extract writing",
  submissionId,
}: ExtractSubmissionButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "extracting" | "error">("idle");
  const [message, setMessage] = useState("");

  async function extractSubmission() {
    setStatus("extracting");
    setMessage("");

    try {
      const response = await fetch(`/api/submissions/${submissionId}/extract`, {
        method: "POST",
      });
      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message ?? "Writing extraction could not finish.");
      }

      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Writing extraction could not finish.");
    }
  }

  return (
    <div className="inline-action-stack">
      <button
        className="secondary-button"
        disabled={disabled || status === "extracting"}
        onClick={extractSubmission}
        type="button"
      >
        {status === "extracting" ? "Extracting..." : label}
      </button>
      {message && <p className="form-error compact-error">{message}</p>}
    </div>
  );
}
