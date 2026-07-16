"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { StudentSwitcher } from "@/components/app-shell/StudentSwitcher";
import { useWorkspaceAccount } from "@/components/app-shell/WorkspaceAccountContext";
import { pageTitles, type View } from "@/lib/workflow/writing-flow";

type TopbarProps = {
  activeView: View;
};

export function Topbar({ activeView }: TopbarProps) {
  const router = useRouter();
  const { currentStudentId, email, students } = useWorkspaceAccount();
  const accountInitial = email.slice(0, 1).toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student workspace</p>
        <h1>{pageTitles[activeView]}</h1>
      </div>
      <div className="topbar-actions">
        {activeView !== "settings" && (
          <StudentSwitcher
            currentStudentId={currentStudentId}
            initialStudents={students}
            placement="topbar"
          />
        )}
        {email && (
          <span className="account-avatar" title={email} aria-label={`Account ${email}`}>
            {accountInitial}
          </span>
        )}
        <button className="icon-button">EN</button>
        <Link className="icon-button" href="/workspace/settings" aria-label="Account settings">
          Settings
        </Link>
        <button className="secondary-button" onClick={logout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
}
