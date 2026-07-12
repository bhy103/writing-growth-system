"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StudentOption = {
  id: string;
  displayName: string;
};

type StudentSwitcherProps = {
  placement?: "topbar" | "sidebar";
};

export function StudentSwitcher({ placement = "topbar" }: StudentSwitcherProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      const response = await fetch("/api/students");
      const result = response.ok ? await response.json() : null;

      if (cancelled) {
        return;
      }

      if (Array.isArray(result?.students) && result.students.length > 0) {
        setStudents(result.students);
        setCurrentStudentId(result.currentStudentId ?? result.students[0]?.id ?? "");
        return;
      }

      const fallbackResponse = await fetch("/api/auth/me");
      const fallbackResult = await fallbackResponse.json();
      const fallbackName = fallbackResult.user?.displayName;

      if (!cancelled && fallbackName && fallbackName !== fallbackResult.user?.email) {
        setStudents([{ id: "fallback-student", displayName: fallbackName }]);
        setCurrentStudentId("fallback-student");
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  async function switchStudent(studentId: string) {
    if (studentId === "fallback-student") {
      return;
    }

    setCurrentStudentId(studentId);
    await fetch("/api/students/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.push("/workspace");
    router.refresh();
  }

  if (students.length === 0) {
    return null;
  }

  const currentStudent = students.find((student) => student.id === currentStudentId) ?? students[0];

  if (students.length === 1) {
    return (
      <section className={`student-switcher ${placement}`} aria-label="Current student">
        {placement === "sidebar" && <span>Current student</span>}
        <strong>{currentStudent.displayName}</strong>
      </section>
    );
  }

  return (
    <section className={`student-switcher ${placement}`} aria-label="Current student">
      {placement === "sidebar" && <span>Current student</span>}
      <select onChange={(event) => switchStudent(event.target.value)} value={currentStudentId}>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.displayName}
          </option>
        ))}
      </select>
    </section>
  );
}
