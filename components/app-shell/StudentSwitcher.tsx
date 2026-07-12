"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type StudentOption = {
  id: string;
  displayName: string;
};

export function StudentSwitcher() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      const response = await fetch("/api/students");
      const result = await response.json();

      if (cancelled) {
        return;
      }

      setStudents(Array.isArray(result.students) ? result.students : []);
      setCurrentStudentId(result.currentStudentId ?? "");
    }

    void loadStudents();

    return () => {
      cancelled = true;
    };
  }, []);

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

  if (students.length === 0) {
    return null;
  }

  const currentStudent = students.find((student) => student.id === currentStudentId) ?? students[0];

  if (students.length === 1) {
    return <span className="student-name-chip">{currentStudent.displayName}</span>;
  }

  return (
    <section className="topbar-student-switcher" aria-label="Current student">
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
