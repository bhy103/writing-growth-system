export type View =
  | "dashboard"
  | "new-writing"
  | "upload-review"
  | "report"
  | "revision"
  | "history"
  | "parent"
  | "settings";

export const pageTitles: Record<View, string> = {
  dashboard: "Dashboard",
  "new-writing": "New Writing",
  "upload-review": "Upload & Text Review",
  report: "AI Writing Report",
  revision: "Revision Workspace",
  history: "Writing History",
  parent: "Parent Progress View",
  settings: "Account Settings",
};

export const viewRoutes: Record<View, string> = {
  dashboard: "/workspace",
  "new-writing": "/workspace/new-writing",
  "upload-review": "/workspace/upload-review",
  report: "/workspace/report",
  revision: "/workspace/revision",
  history: "/workspace/history",
  parent: "/workspace/parent",
  settings: "/workspace/settings",
};

export const navItems: Array<{ view: View; label: string; testId: string; href: string }> = [
  { view: "dashboard", label: "Dashboard", testId: "nav-dashboard", href: viewRoutes.dashboard },
  { view: "new-writing", label: "New Writing", testId: "nav-new-writing", href: viewRoutes["new-writing"] },
  { view: "report", label: "AI Report", testId: "nav-report", href: viewRoutes.report },
  { view: "revision", label: "Revision", testId: "nav-revision", href: viewRoutes.revision },
  { view: "history", label: "History", testId: "nav-history", href: viewRoutes.history },
  { view: "parent", label: "Parent View", testId: "nav-parent", href: viewRoutes.parent },
  { view: "settings", label: "Settings", testId: "nav-settings", href: viewRoutes.settings },
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
  "new-writing": 0,
  "upload-review": 0,
  report: 2,
  revision: 3,
  history: 2,
  parent: 4,
  settings: 0,
};
