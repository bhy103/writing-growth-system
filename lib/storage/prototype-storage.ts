import { initialDraft, initialHistory } from "@/lib/mock/mock-data";

export type PrototypeHistoryItem = {
  title: string;
  status: string;
  focus: string;
};

export type PrototypeSnapshot = {
  title: string;
  draft: string;
  history: PrototypeHistoryItem[];
};

export const storageKey = "writing-growth-system.prototype.v1";

export const defaultPrototypeSnapshot: PrototypeSnapshot = {
  title: initialDraft.title,
  draft: initialDraft.content,
  history: initialHistory,
};

function isHistoryItem(value: unknown): value is PrototypeHistoryItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;
  return (
    typeof item.title === "string" &&
    typeof item.status === "string" &&
    typeof item.focus === "string"
  );
}

function isSnapshot(value: unknown): value is PrototypeSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;
  return (
    typeof snapshot.title === "string" &&
    typeof snapshot.draft === "string" &&
    Array.isArray(snapshot.history) &&
    snapshot.history.every(isHistoryItem)
  );
}

export function loadPrototypeSnapshot(): PrototypeSnapshot {
  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return defaultPrototypeSnapshot;
  }

  try {
    const parsed = JSON.parse(stored);
    return isSnapshot(parsed) ? parsed : defaultPrototypeSnapshot;
  } catch {
    return defaultPrototypeSnapshot;
  }
}

export function savePrototypeSnapshot(snapshot: PrototypeSnapshot) {
  window.localStorage.setItem(storageKey, JSON.stringify(snapshot));
}

export function clearPrototypeSnapshot() {
  window.localStorage.removeItem(storageKey);
}
