"use client";

import { useEffect, useMemo, useState } from "react";

type VocabularySet = {
  id: string;
  title: string;
  words: string[];
  vocabularySection?: string;
  worksheet?: string;
  answerKey?: string;
  createdAt?: string;
};

type VocabularyResponse = {
  set: VocabularySet;
  pack: {
    vocabularySection: string;
    worksheet: string;
    answerKey: string;
    wordCount: number;
    meaningCount: number;
  };
};

function splitWords(words: string) {
  return words
    .split(/[\n,;]+/)
    .map((word) => word.trim())
    .filter(Boolean);
}

export function VocabularyCoach() {
  const [title, setTitle] = useState("");
  const [words, setWords] = useState("");
  const [recentSets, setRecentSets] = useState<VocabularySet[]>([]);
  const [activeSet, setActiveSet] = useState<VocabularySet | null>(null);
  const [activePack, setActivePack] = useState<VocabularyResponse["pack"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const wordPreview = useMemo(() => splitWords(words), [words]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecentSets() {
      const response = await fetch("/api/vocabulary");
      const data = await response.json().catch(() => null);

      if (!isMounted || !response.ok || !data?.sets) {
        return;
      }

      setRecentSets(data.sets);
    }

    loadRecentSets();

    return () => {
      isMounted = false;
    };
  }, []);

  async function generatePack() {
    setMessage("");

    if (wordPreview.length === 0) {
      setMessage("Please enter at least one word.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/vocabulary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          words,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message ?? "Vocabulary generation failed.");
      }

      const result = data as VocabularyResponse;
      setActiveSet(result.set);
      setActivePack(result.pack);
      setRecentSets((current) => [result.set, ...current.filter((set) => set.id !== result.set.id)].slice(0, 12));
      setMessage("Vocabulary study pack created.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vocabulary generation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  function showRecent(set: VocabularySet) {
    setActiveSet(set);
    setActivePack(null);
    setMessage("Open the PDF to review this saved vocabulary pack.");
  }

  const canDownload = Boolean(activeSet?.id);

  return (
    <div className="vocabulary-workspace">
      <section className="vocabulary-hero panel">
        <div>
          <p className="eyebrow">Vocabulary coach</p>
          <h2>Build a personal word bank.</h2>
          <p>
            Add the words a student needs to learn. AI will organise meanings, examples, practice questions, and an answer key
            into a printable study pack.
          </p>
        </div>
        <div className="vocabulary-hero-stat">
          <span>Current list</span>
          <strong>{wordPreview.length}</strong>
          <small>words ready</small>
        </div>
      </section>

      <section className="vocabulary-grid">
        <div className="panel vocabulary-input-panel">
          <div className="section-heading">
            <h3>Create study pack</h3>
          </div>

          <label htmlFor="vocabulary-title">Pack title optional</label>
          <input
            id="vocabulary-title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Week 3 spelling and vocabulary"
            value={title}
          />

          <label htmlFor="vocabulary-words">Words</label>
          <textarea
            id="vocabulary-words"
            className="vocabulary-word-input"
            onChange={(event) => setWords(event.target.value)}
            placeholder="Enter one word per line, or separate words with commas."
            value={words}
          />

          {wordPreview.length > 0 && (
            <div className="word-chip-list" aria-label="Words ready for generation">
              {wordPreview.slice(0, 18).map((word) => (
                <span key={word}>{word}</span>
              ))}
              {wordPreview.length > 18 && <span>+{wordPreview.length - 18} more</span>}
            </div>
          )}

          <div className="button-row">
            <button className="primary-button large" disabled={isLoading} onClick={generatePack} type="button">
              {isLoading ? "Creating..." : "Create vocabulary pack"}
            </button>
            {canDownload && (
              <a className="secondary-button vocabulary-download-link" href={`/api/vocabulary/${activeSet?.id}/pdf`}>
                Download PDF
              </a>
            )}
          </div>

          {message && <p className={`form-message ${message.includes("created") || message.includes("Open") ? "success" : "error"}`}>{message}</p>}
        </div>

        <aside className="panel vocabulary-recent-panel">
          <div className="section-heading">
            <h3>Recent packs</h3>
          </div>
          {recentSets.length === 0 ? (
            <p>No vocabulary packs yet.</p>
          ) : (
            <div className="vocabulary-set-list">
              {recentSets.map((set) => (
                <button key={set.id} className="vocabulary-set-row" onClick={() => showRecent(set)} type="button">
                  <strong>{set.title}</strong>
                  <span>{Array.isArray(set.words) ? set.words.length : 0} words</span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </section>

      {activePack && (
        <section className="vocabulary-output-grid">
          <article className="panel vocabulary-output-card">
            <p className="eyebrow">Part 1</p>
            <h3>Vocabulary Section</h3>
            <pre>{activePack.vocabularySection}</pre>
          </article>
          <article className="panel vocabulary-output-card">
            <p className="eyebrow">Part 2</p>
            <h3>Worksheet</h3>
            <pre>{activePack.worksheet}</pre>
          </article>
          <article className="panel vocabulary-output-card">
            <p className="eyebrow">Part 3</p>
            <h3>Answer Key</h3>
            <pre>{activePack.answerKey}</pre>
          </article>
        </section>
      )}
    </div>
  );
}
