"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type StudentOption = {
  id: string;
  displayName: string;
};

type StudentSwitcherProps = {
  currentStudentId?: string;
  initialStudents?: StudentOption[];
  placement?: "topbar" | "sidebar";
};

export function StudentSwitcher({
  currentStudentId: providedCurrentStudentId = "",
  initialStudents = [],
  placement = "topbar",
}: StudentSwitcherProps) {
  const router = useRouter();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const currentStudentId = selectedStudentId || providedCurrentStudentId;

  async function switchStudent(studentId: string) {
    setSelectedStudentId(studentId);
    await fetch("/api/students/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.push("/workspace");
    router.refresh();
  }

  if (initialStudents.length === 0) {
    return null;
  }

  const currentStudent = initialStudents.find((student) => student.id === currentStudentId) ?? initialStudents[0];

  if (initialStudents.length === 1) {
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
        {initialStudents.map((student) => (
          <option key={student.id} value={student.id}>
            {student.displayName}
          </option>
        ))}
      </select>
    </section>
  );
}
