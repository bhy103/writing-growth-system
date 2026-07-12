"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StudentOption = {
  id: string;
  displayName: string;
};

type StudentSwitcherProps = {
  currentStudentId?: string;
  fallbackStudentName?: string;
  initialStudents?: StudentOption[];
  placement?: "topbar" | "sidebar";
};

export function StudentSwitcher({
  currentStudentId: providedCurrentStudentId = "",
  fallbackStudentName = "",
  initialStudents = [],
  placement = "topbar",
}: StudentSwitcherProps) {
  const router = useRouter();
  const [loadedStudents, setLoadedStudents] = useState<StudentOption[]>([]);
  const [loadedCurrentStudentId, setLoadedCurrentStudentId] = useState("");
  const students = initialStudents.length > 0 ? initialStudents : loadedStudents;
  const currentStudentId = loadedCurrentStudentId || providedCurrentStudentId;

  useEffect(() => {
    if (initialStudents.length > 0 || fallbackStudentName) {
      return;
    }

    let cancelled = false;

    async function loadStudents() {
      const response = await fetch("/api/students");
      const result = response.ok ? await response.json() : null;

      if (cancelled) {
        return;
      }

      if (Array.isArray(result?.students) && result.students.length > 0) {
        setLoadedStudents(result.students);
        setLoadedCurrentStudentId(result.currentStudentId ?? result.students[0]?.id ?? "");
        return;
      }

      const fallbackResponse = await fetch("/api/auth/me");
      const fallbackResult = await fallbackResponse.json();
      const fallbackName = fallbackResult.user?.displayName;

      if (!cancelled && fallbackName && fallbackName !== fallbackResult.user?.email) {
        setLoadedStudents([{ id: "fallback-student", displayName: fallbackName }]);
        setLoadedCurrentStudentId("fallback-student");
      }
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, [fallbackStudentName, initialStudents.length]);

  async function switchStudent(studentId: string) {
    if (studentId === "fallback-student") {
      return;
    }

    setLoadedCurrentStudentId(studentId);
    await fetch("/api/students/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.push("/workspace");
    router.refresh();
  }

  if (students.length === 0) {
    return fallbackStudentName ? (
      <section className={`student-switcher ${placement}`} aria-label="Current student">
        {placement === "sidebar" && <span>Current student</span>}
        <strong>{fallbackStudentName}</strong>
      </section>
    ) : null;
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
