import { type ReactNode } from "react";
import { Sidebar } from "@/components/app-shell/Sidebar";
import { Topbar } from "@/components/app-shell/Topbar";
import { FlowProgress } from "@/components/app-shell/FlowProgress";
import { type View } from "@/lib/workflow/writing-flow";

type AppShellProps = {
  activeView: View;
  children: ReactNode;
};

export function AppShell({ activeView, children }: AppShellProps) {
  const showFlowProgress = activeView !== "dashboard" && activeView !== "settings";

  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} />
      <main className="main">
        <Topbar activeView={activeView} />
        {showFlowProgress && <FlowProgress activeView={activeView} />}
        {children}
      </main>
    </div>
  );
}
