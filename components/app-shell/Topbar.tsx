"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StudentSwitcher } from "@/components/app-shell/StudentSwitcher";
import { pageTitles, type View } from "@/lib/workflow/writing-flow";

type TopbarProps = {
  activeView: View;
};

export function Topbar({ activeView }: TopbarProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const response = await fetch("/api/auth/me");
      const result = await response.json();
      setEmail(result.user?.email ?? "");
    }

    loadUser();
  }, []);

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
        {activeView !== "settings" && <StudentSwitcher placement="topbar" />}
        {email && <span className="user-chip">{email}</span>}
        <button className="icon-button">EN</button>
        <button className="secondary-button" onClick={logout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
}
