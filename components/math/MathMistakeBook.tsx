"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MathProblem = {
  id: string;
  title: string;
  category: string;
  notes?: string | null;
  fileName?: string | null;
  fileType?: string | null;
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

function createFileKey(file: File) {
  return `${file.name}-${file.type}-${file.size}`;
}

function uniqueImageFiles(nextFiles: File[]) {
  const uniqueFiles = new Map<string, File>();

  for (const file of nextFiles) {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      continue;
    }

    uniqueFiles.set(createFileKey(file), file);
  }

  return Array.from(uniqueFiles.values());
}

function createEnhancedFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "math-problem";
  return `${baseName}-enhanced.png`;
}

async function enhanceWorksheetImage(file: File) {
  if (typeof window === "undefined") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = bitmap.width < 1000 ? Math.min(2, 1200 / bitmap.width) : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    bitmap.close();
    return file;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.28 + 138));
    const cleaned = contrasted > 238 ? 255 : contrasted < 48 ? 0 : contrasted;
    data[index] = cleaned;
    data[index + 1] = cleaned;
    data[index + 2] = cleaned;
  }

  context.putImageData(imageData, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png", 0.95);
  });

  if (!blob) {
    return file;
  }

  return new File([blob], createEnhancedFileName(file.name), {
    lastModified: file.lastModified,
    type: "image/png",
  });
}

export function MathMistakeBook() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recentPasteRef = useRef<{ signature: string; time: number } | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [problemText, setProblemText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [lastBatchProblems, setLastBatchProblems] = useState<MathProblem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const previewItems = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
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
      previewItems.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewItems]);

  function chooseFile() {
    fileInputRef.current?.click();
  }

  async function addFiles(nextFiles: File[]) {
    const imageFiles = await Promise.all(uniqueImageFiles(nextFiles).map((file) => enhanceWorksheetImage(file)));
    const existingKeys = new Set(files.map(createFileKey));
    const newImageFiles = imageFiles.filter((file) => !existingKeys.has(createFileKey(file)));
    const nextTotal = Math.min(files.length + newImageFiles.length, 24);

    setFiles((current) => {
      const currentKeys = new Set(current.map(createFileKey));
      const uniqueNewFiles = imageFiles.filter((file) => !currentKeys.has(createFileKey(file)));
      return [...current, ...uniqueNewFiles].slice(0, 24);
    });

    if (nextFiles.length !== imageFiles.length) {
      setMessage("Only JPG and PNG images were added.");
    } else if (newImageFiles.length === 0 && imageFiles.length > 0) {
      setMessage("This image is already in the current batch.");
    } else if (files.length + newImageFiles.length > 24) {
      setMessage(`Added ${nextTotal} images. A single batch can include up to 24 images.`);
    } else if (newImageFiles.length > 0) {
      setMessage(`${newImageFiles.length} image${newImageFiles.length === 1 ? "" : "s"} added and enhanced for print.`);
    }
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const rawPastedFiles = [
      ...Array.from(event.clipboardData.files),
      ...Array.from(event.clipboardData.items)
        .map((item) => (item.kind === "file" ? item.getAsFile() : null))
        .filter((item): item is File => Boolean(item)),
    ];
    const pastedFiles = Array.from(
      new Map(rawPastedFiles.map((file) => [createFileKey(file), file])).values(),
    );

    if (pastedFiles.length > 0) {
      const signature = pastedFiles.map(createFileKey).sort().join("|");
      const now = Date.now();

      event.preventDefault();

      if (recentPasteRef.current?.signature === signature && now - recentPasteRef.current.time < 1000) {
        return;
      }

      recentPasteRef.current = { signature, time: now };
      void addFiles(pastedFiles);
    }
  }

  async function saveProblems() {
    setMessage("");

    if (files.length === 0 && !problemText.trim()) {
      setMessage("Please paste a math question or add at least one image.");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.set("title", title);
    formData.set("category", category);
    formData.set("notes", notes);
    formData.set("problemText", problemText);
    setIsSaving(true);

    try {
      const response = await fetch("/api/math-problems", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? "Could not save these math problems.");
      }

      const savedProblems = Array.isArray(data?.problems) ? data.problems : data?.problem ? [data.problem] : [];
      setProblems((current) => [...savedProblems, ...current]);
      setLastBatchProblems(savedProblems);
      setTitle("");
      setCategory("");
      setNotes("");
      setProblemText("");
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setMessage(`${savedProblems.length} math problem${savedProblems.length === 1 ? "" : "s"} saved and classified.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save these math problems.");
    } finally {
      setIsSaving(false);
    }
  }

  const pdfCacheKey = encodeURIComponent(
    `${visibleProblems.length}-${visibleProblems[0]?.createdAt ?? "empty"}-${lastBatchProblems.length}`,
  );
  const mathPdfEndpoint = "/api/math-problems/review-pdf";
  const pdfUrl =
    selectedCategory === "All"
      ? `${mathPdfEndpoint}?t=${pdfCacheKey}`
      : `${mathPdfEndpoint}?category=${encodeURIComponent(selectedCategory)}&t=${pdfCacheKey}`;
  const lastBatchPdfUrl =
    lastBatchProblems.length > 0
      ? `${mathPdfEndpoint}?ids=${encodeURIComponent(lastBatchProblems.map((problem) => problem.id).join(","))}&t=${pdfCacheKey}`
      : "";

  return (
    <div className="math-workspace">
      <section className="panel math-hero">
        <div>
          <p className="eyebrow">Math mistake book</p>
          <h2>Collect problems worth reviewing.</h2>
          <p>
            Paste several screenshots or questions into one box. AI will read each problem, choose the main topic, and
            save everything into a printable PDF archive.
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
            <h3>Batch add mistakes</h3>
          </div>

          <div className="form-grid two-columns">
            <div>
              <label htmlFor="math-title">Shared title optional</label>
              <input
                id="math-title"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Leave blank for AI titles"
                value={title}
              />
            </div>
            <div>
              <label htmlFor="math-category">Force topic optional</label>
              <input
                id="math-category"
                list="math-category-options"
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Leave blank for AI classification"
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

          <label htmlFor="math-notes">Batch note optional</label>
          <input
            id="math-notes"
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Applied to this batch, e.g. Homework corrections"
            value={notes}
          />

          <label htmlFor="math-intake">Paste questions or images</label>
          <textarea
            id="math-intake"
            className="math-intake-box"
            onChange={(event) => setProblemText(event.target.value)}
            onPaste={handlePaste}
            placeholder="Paste many screenshots here at once, or paste text questions separated by blank lines."
            value={problemText}
          />

          <input
            ref={fileInputRef}
            accept="image/png,image/jpeg"
            className="hidden-file-input"
            multiple
            onChange={(event) => void addFiles(Array.from(event.target.files ?? []))}
            type="file"
          />

          <button className="math-dropzone" onClick={chooseFile} type="button">
            <span>
              <strong>Add images</strong>
              <small>Select multiple JPG or PNG screenshots, or paste images into the box above. Images are cleaned for print.</small>
            </span>
          </button>

          {previewItems.length > 0 && (
            <div className="math-batch-count">
              <strong>{previewItems.length}</strong>
              <span>images ready for this batch</span>
            </div>
          )}

          {previewItems.length > 0 && (
            <div className="math-preview-grid" aria-label="Selected math images">
              {previewItems.map((item, index) => (
                <div key={`${item.file.name}-${item.file.lastModified}-${index}`} className="math-preview-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={`Selected math problem ${index + 1}`} src={item.url} />
                  <div>
                    <strong>{item.file.name}</strong>
                    <span>{formatSize(item.file.size)}</span>
                  </div>
                  <button onClick={() => removeFile(index)} type="button">
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="button-row">
            <button className="primary-button large" disabled={isSaving} onClick={saveProblems} type="button">
              {isSaving ? "Classifying and saving..." : "Save and classify"}
            </button>
            {lastBatchPdfUrl && (
              <a className="secondary-button" href={lastBatchPdfUrl}>
                Download this batch PDF
              </a>
            )}
          </div>

          {message && (
            <p className={`form-message ${message.includes("saved") || message.includes("classified") ? "success" : "error"}`}>
              {message}
            </p>
          )}
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
            Download archive PDF
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
                    {problem.category} | {formatDate(problem.createdAt)} | {formatSize(problem.fileSize)}
                  </span>
                  {problem.notes && <p>{problem.notes}</p>}
                </div>
                <span>{problem.fileType ? problem.fileType.replace("image/", "").toUpperCase() : "TEXT"}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
