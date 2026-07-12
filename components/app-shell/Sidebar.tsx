import Link from "next/link";
import { StudentSwitcher } from "@/components/app-shell/StudentSwitcher";
import { navItems, type View } from "@/lib/workflow/writing-flow";

type SidebarProps = {
  activeView: View;
};

export function Sidebar({ activeView }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">W</div>
        <div>
          <strong>Writing Growth</strong>
          <span>English writing coach</span>
        </div>
      </div>
      <StudentSwitcher />
      <nav className="nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.view}
            className={`nav-item ${activeView === item.view ? "active" : ""}`}
            data-testid={item.testId}
            href={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
