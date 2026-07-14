export type View =
  | "dashboard"
  | "vocabulary"
  | "math"
  | "new-writing"
  | "upload-review"
  | "report"
  | "revision"
  | "history"
  | "parent"
  | "settings";

export const pageTitles: Record<View, string> = {
  dashboard: "Writing Coach",
  vocabulary: "Vocabulary Coach",
  math: "Math Coach",
  "new-writing": "New Writing",
  "upload-review": "Upload Submission",
  report: "AI Writing Report",
  revision: "Revision Workspace",
  history: "Writing History",
  parent: "Parent Progress View",
  settings: "Account Settings",
};

export const viewRoutes: Record<View, string> = {
  dashboard: "/workspace",
  vocabulary: "/workspace/vocabulary",
  math: "/workspace/math",
  "new-writing": "/workspace/new-writing",
  "upload-review": "/workspace/upload-review",
  report: "/workspace/report",
  revision: "/workspace/revision",
  history: "/workspace/history",
  parent: "/workspace/parent",
  settings: "/workspace/settings",
};

export const navItems: Array<{ view: View; label: string; testId: string; href: string; caption: string }> = [
  { view: "dashboard", label: "Writing", testId: "nav-writing", href: viewRoutes.dashboard, caption: "Drafts, feedback, revision" },
  { view: "vocabulary", label: "Vocabulary", testId: "nav-vocabulary", href: viewRoutes.vocabulary, caption: "Word growth and usage" },
  { view: "math", label: "Math", testId: "nav-math", href: viewRoutes.math, caption: "Problem practice coach" },
];

export const flowSteps = [
  { label: "Draft", href: viewRoutes["new-writing"] },
  { label: "Analyze", href: viewRoutes["new-writing"] },
  { label: "Report", href: viewRoutes.report },
  { label: "Revise", href: viewRoutes.revision },
  { label: "Parent Summary", href: viewRoutes.parent },
];

export const viewStep: Record<View, number> = {
  dashboard: 0,
  vocabulary: 0,
  math: 0,
  "new-writing": 0,
  "upload-review": 0,
  report: 2,
  revision: 3,
  history: 2,
  parent: 4,
  settings: 0,
};
