"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MathProblem = {
  id: string;
  title: string;
  category: string;
  notes?: string | null;
  fileName: string;
  fileType: string;
  fileSize?: number | null;
  createdAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatSize(value?: number | null) {
  if (!value) {
    return "Size unavailable";
  }

  return value >= 1024 * 1024 ? `${(value / 1024 / 1024).toFixed(1)} MB` : `${Math.round(value / 1024)} KB`;
}

export function MathMistakeBook() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const previewUrl = useMemo(() => {
    if (!file) {
      return "";
    }

    return URL.createObjectURL(file);
  }, [file]);
  const categories = useMemo(() => {
    const values = Array.from(new Set(problems.map((problem) => problem.category))).sort((a, b) => a.localeCompare(b));
    return ["All", ...values];
  }, [problems]);
  const visibleProblems = selectedCategory === "All" ? problems : problems.filter((problem) => problem.category === selectedCategory);

  useEffect(() => {
    let isMounted = true;

    async function loadProblems() {
      const response = await fetch("/api/math-problems");
      const data = await response.json().catch(() => null);

      if (!isMounted || !response.ok || !Array.isArray(data?.problems)) {
        return;
      }

      setProblems(data.problems);
    }

    loadProblems();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function chooseFile() {
    fileInputRef.current?.click();
  }

  async function saveProblem() {
    setMessage("");

    if (!file) {
      setMessage("Please choose a screenshot or photo first.");
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title);
    formData.set("category", category);
    formData.set("notes", notes);
    setIsSaving(true);

    try {
      const response = await fetch("/api/math-problems", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? "Could not save this math problem.");
      }

      setProblems((current) => [data.problem, ...current]);
      setTitle("");
      setCategory("");
      setNotes("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage("Math problem saved to the mistake book.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save this math problem.");
    } finally {
      setIsSaving(false);
    }
  }

  const pdfUrl =
    selectedCategory === "All"
      ? "/api/math-problems/pdf"
      : `/api/math-problems/pdf?category=${encodeURIComponent(selectedCategory)}`;

  return (
    <div className="math-workspace">
      <section className="panel math-hero">
        <div>
          <p className="eyebrow">Math mistake book</p>
          <h2>Collect problems worth reviewing.</h2>
          <p>
            Upload a screenshot or photo of a missed question, give it a topic, and keep a printable PDF archive for
            revision.
          </p>
        </div>
        <div className="vocabulary-hero-stat">
          <span>Saved</span>
          <strong>{problems.length}</strong>
          <small>problems</small>
        </div>
      </section>

      <section className="math-grid">
        <div className="panel math-upload-panel">
          <div className="section-heading">
            <h3>Add mistake</h3>
          </div>

          <div className="form-grid two-columns">
            <div>
              <label htmlFor="math-title">Question title optional</label>
              <input
                id="math-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Fractions word problem"
                value={title}
              />
            </div>
            <div>
              <label htmlFor="math-category">Topic / category</label>
              <input
                id="math-category"
                list="math-category-options"
                onChange={(event) => setCategory(event.target.value)}
                placeholder="e.g. Fractions, Algebra, Geometry"
                value={category}
              />
              <datalist id="math-category-options">
                {categories
                  .filter((value) => value !== "All")
                  .map((value) => (
                    <option key={value} value={value} />
                  ))}
              </datalist>
            </div>
          </div>

          <label htmlFor="math-notes">Short note optional</label>
          <input
            id="math-notes"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="e.g. Misread the unit, forgot to simplify"
            value={notes}
          />

          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg"
            className="hidden-file-input"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />

          <button className="math-dropzone" onClick={chooseFile} type="button">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Selected math problem preview" src={previewUrl} />
            ) : (
              <span>
                <strong>Choose screenshot or photo</strong>
                <small>JPG or PNG question image</small>
              </span>
            )}
          </button>

          {file && (
            <p className="math-file-note">
              {file.name} · {formatSize(file.size)}
            </p>
          )}

          <div className="button-row">
            <button className="primary-button large" disabled={isSaving} onClick={saveProblem} type="button">
              {isSaving ? "Saving..." : "Save to mistake book"}
            </button>
          </div>

          {message && <p className={`form-message ${message.includes("saved") ? "success" : "error"}`}>{message}</p>}
        </div>

        <aside className="panel math-archive-panel">
          <div className="section-heading">
            <h3>PDF archive</h3>
          </div>

          <label htmlFor="math-filter">Show topic</label>
          <select id="math-filter" onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <a className={`primary-button math-pdf-link ${visibleProblems.length === 0 ? "disabled-link" : ""}`} href={pdfUrl}>
            Download PDF
          </a>
          <p>{visibleProblems.length} problem{visibleProblems.length === 1 ? "" : "s"} in this PDF.</p>
        </aside>
      </section>

      <section className="panel math-list-panel">
        <div className="section-heading">
          <h3>Saved questions</h3>
        </div>
        {visibleProblems.length === 0 ? (
          <p>No math problems saved for this topic yet.</p>
        ) : (
          <div className="math-problem-list">
            {visibleProblems.map((problem) => (
              <article key={problem.id} className="math-problem-row">
                <div>
                  <strong>{problem.title}</strong>
                  <span>
                    {problem.category} · {formatDate(problem.createdAt)} · {formatSize(problem.fileSize)}
                  </span>
                  {problem.notes && <p>{problem.notes}</p>}
                </div>
                <span>{problem.fileType.replace("image/", "").toUpperCase()}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
