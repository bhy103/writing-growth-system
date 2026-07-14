import Link from "next/link";
import { navItems, type View } from "@/lib/workflow/writing-flow";

type SidebarProps = {
  activeView: View;
};

export function Sidebar({ activeView }: SidebarProps) {
  const activeNavView = activeView === "vocabulary" || activeView === "math" ? activeView : "dashboard";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">C</div>
        <div>
          <strong>Family Coach</strong>
          <span>Personal learning coach</span>
        </div>
      </div>
      <nav className="nav" aria-label="Main navigation">
        <p className="nav-section-label">Subjects</p>
        {navItems.map((item) => (
          <Link
            key={item.view}
            className={`nav-item ${activeNavView === item.view ? "active" : ""}`}
            data-testid={item.testId}
            href={item.href}
          >
            <strong>{item.label}</strong>
            <span>{item.caption}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
