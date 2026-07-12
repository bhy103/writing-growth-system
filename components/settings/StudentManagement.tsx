"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BirthdaySelectField } from "@/components/profile/BirthdaySelectField";

const gradeOptions = [
  "Kindergarten",
  "Prep",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
];
const genderOptions = ["Female", "Male", "Non-binary", "Prefer not to say"];

type Student = {
  id: string;
  displayName: string;
  gender?: string | null;
  gradeLevel?: string | null;
  schoolName?: string | null;
};

export function StudentManagement() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudentId, setCurrentStudentId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [gender, setGender] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function loadStudents() {
    const response = await fetch("/api/students");
    const result = await response.json();

    setStudents(Array.isArray(result.students) ? result.students : []);
    setCurrentStudentId(result.currentStudentId ?? "");
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialStudents() {
      const response = await fetch("/api/students");
      const result = await response.json();

      if (cancelled) {
        return;
      }

      setStudents(Array.isArray(result.students) ? result.students : []);
      setCurrentStudentId(result.currentStudentId ?? "");
    }

    void loadInitialStudents();

    return () => {
      cancelled = true;
    };
  }, []);

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        familyName,
        birthday,
        gender,
        gradeLevel,
        schoolName,
      }),
    });
    const result = await response.json();

    setIsSaving(false);

    if (!response.ok) {
      setMessage(result.message ?? "Unable to add student.");
      return;
    }

    setFirstName("");
    setFamilyName("");
    setBirthday("");
    setGender("");
    setGradeLevel("");
    setSchoolName("");
    setMessage("Student added and selected.");
    await loadStudents();
  }

  async function switchStudent(studentId: string) {
    setCurrentStudentId(studentId);
    await fetch("/api/students/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    router.refresh();
  }

  return (
    <section className="panel settings-panel">
      <p className="eyebrow">Students</p>
      <h3>Student Profiles</h3>

      <div className="student-list">
        {students.map((student) => (
          <div className={`student-card ${student.id === currentStudentId ? "active" : ""}`} key={student.id}>
            <div>
              <strong>{student.displayName}</strong>
              <span>
                {[student.gradeLevel, student.gender, student.schoolName].filter(Boolean).join(" / ") || "Profile saved"}
              </span>
            </div>
            <button className="secondary-button" disabled={student.id === currentStudentId} onClick={() => switchStudent(student.id)} type="button">
              {student.id === currentStudentId ? "Current" : "Select"}
            </button>
          </div>
        ))}
      </div>

      <form className="student-add-form" onSubmit={addStudent}>
        <h4>Add Student</h4>
        <div className="form-grid two-columns">
          <div>
            <label htmlFor="new-student-first-name">First name</label>
            <input id="new-student-first-name" onChange={(event) => setFirstName(event.target.value)} required value={firstName} />
          </div>
          <div>
            <label htmlFor="new-student-family-name">Family name</label>
            <input id="new-student-family-name" onChange={(event) => setFamilyName(event.target.value)} required value={familyName} />
          </div>
        </div>

        <label>Birthday</label>
        <BirthdaySelectField onChange={setBirthday} value={birthday} />

        <div className="form-grid two-columns">
          <div>
            <label htmlFor="new-student-gender">Gender</label>
            <select id="new-student-gender" onChange={(event) => setGender(event.target.value)} value={gender}>
              <option value="">Select gender</option>
              {genderOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-student-grade">Grade</label>
            <select id="new-student-grade" onChange={(event) => setGradeLevel(event.target.value)} value={gradeLevel}>
              <option value="">Select grade</option>
              {gradeOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label htmlFor="new-student-school">School optional</label>
        <input id="new-student-school" onChange={(event) => setSchoolName(event.target.value)} value={schoolName} />

        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? "Adding..." : "Add student"}
        </button>
        {message && <p className={`form-message ${message.includes("Unable") ? "error" : "success"}`}>{message}</p>}
      </form>
    </section>
  );
}
