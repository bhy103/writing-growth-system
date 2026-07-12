"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function ProfileSetupPage() {
  const router = useRouter();
  const [parentName, setParentName] = useState("");
  const [parentBirthday, setParentBirthday] = useState("");
  const [address, setAddress] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentBirthday, setStudentBirthday] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parentName,
        parentBirthday,
        address,
        studentName,
        studentBirthday,
        gradeLevel,
        schoolName,
      }),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.message ?? "Profile setup failed.");
      return;
    }

    router.push("/workspace");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel profile-setup-panel">
        <p className="eyebrow">Profile setup</p>
        <h1>Complete Your Profile</h1>
        <p className="auth-intro">Add parent information and the first student before starting writing practice.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h3>Parent information</h3>
          <label htmlFor="parent-name">Parent name</label>
          <input id="parent-name" onChange={(event) => setParentName(event.target.value)} required value={parentName} />

          <label htmlFor="parent-birthday">Parent birthday</label>
          <input
            id="parent-birthday"
            onChange={(event) => setParentBirthday(event.target.value)}
            type="date"
            value={parentBirthday}
          />

          <label htmlFor="address">Address</label>
          <input id="address" onChange={(event) => setAddress(event.target.value)} value={address} />

          <h3>Student information</h3>
          <label htmlFor="student-name">Student name</label>
          <input id="student-name" onChange={(event) => setStudentName(event.target.value)} required value={studentName} />

          <label htmlFor="student-birthday">Student birthday</label>
          <input
            id="student-birthday"
            onChange={(event) => setStudentBirthday(event.target.value)}
            type="date"
            value={studentBirthday}
          />

          <label htmlFor="grade-level">Grade</label>
          <input id="grade-level" onChange={(event) => setGradeLevel(event.target.value)} placeholder="Grade 5" value={gradeLevel} />

          <label htmlFor="school-name">School optional</label>
          <input id="school-name" onChange={(event) => setSchoolName(event.target.value)} value={schoolName} />

          <button className="primary-button large" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Saving..." : "Save profile"}
          </button>
          {message && <p className="form-message error">{message}</p>}
        </form>
      </section>
    </main>
  );
}
