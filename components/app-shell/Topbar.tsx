"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { pageTitles, type View } from "@/lib/workflow/writing-flow";

type TopbarProps = {
  activeView: View;
};

type StudentOption = {
  id: string;
  displayName: string;
};

export function Topbar({ activeView }: TopbarProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState("");

  useEffect(() => {
    async function loadWorkspaceContext() {
      const [userResponse, studentsResponse] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/students"),
      ]);
      const userResult = await userResponse.json();
      const studentsResult = await studentsResponse.json();

      setEmail(userResult.user?.email ?? "");
      setStudents(Array.isArray(studentsResult.students) ? studentsResult.students : []);
      setCurrentStudentId(studentsResult.currentStudentId ?? "");
    }

    loadWorkspaceContext();
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function switchStudent(studentId: string) {
    setCurrentStudentId(studentId);
    await fetch("/api/students/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.push("/workspace");
    router.refresh();
  }

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Student workspace</p>
        <h1>{pageTitles[activeView]}</h1>
      </div>
      <div className="topbar-actions">
        {students.length > 0 && (
          <select
            aria-label="Current student"
            className="student-switcher"
            onChange={(event) => switchStudent(event.target.value)}
            value={currentStudentId}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.displayName}
              </option>
            ))}
          </select>
        )}
        {email && <span className="user-chip">{email}</span>}
        <button className="icon-button">EN</button>
        <Link className="primary-button" href="/workspace/new-writing">
          New Writing
        </Link>
        <button className="secondary-button" onClick={logout} type="button">
          Logout
        </button>
      </div>
    </header>
  );
}
