import Link from "next/link";
import { pageTitles, type View } from "@/lib/workflow/writing-flow";

type TopbarProps = {
  activeView: View;
};

export function Topbar({ activeView }: TopbarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student workspace</p>
        <h1>{pageTitles[activeView]}</h1>
      </div>
      <div className="topbar-actions">
        <button className="icon-button">EN</button>
        <Link className="primary-button" href="/workspace/new-writing">
          New Writing
        </Link>
      </div>
    </header>
  );
}
