"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { BirthdaySelectField } from "@/components/profile/BirthdaySelectField";

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const parentTitleOptions = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Mx"];
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

export function ProfileSetupPage() {
  const router = useRouter();
  const [parentTitle, setParentTitle] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentFamilyName, setParentFamilyName] = useState("");
  const [parentBirthday, setParentBirthday] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentFamilyName, setStudentFamilyName] = useState("");
  const [studentBirthday, setStudentBirthday] = useState("");
  const [gender, setGender] = useState("");
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
        parentTitle,
        parentFirstName,
        parentFamilyName,
        parentBirthday,
        streetAddress,
        suburb,
        state,
        postcode,
        studentFirstName,
        studentFamilyName,
        studentBirthday,
        gender,
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
        <p className="auth-intro">Add family details and the first student before starting writing practice.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h3>Parent information</h3>
          <div className="form-grid parent-name-grid">
            <div>
              <label htmlFor="parent-title">Title</label>
              <select id="parent-title" onChange={(event) => setParentTitle(event.target.value)} value={parentTitle}>
                <option value="">Select title</option>
                {parentTitleOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="parent-first-name">First name</label>
              <input
                id="parent-first-name"
                onChange={(event) => setParentFirstName(event.target.value)}
                required
                value={parentFirstName}
              />
            </div>
            <div>
              <label htmlFor="parent-family-name">Family name</label>
              <input
                id="parent-family-name"
                onChange={(event) => setParentFamilyName(event.target.value)}
                required
                value={parentFamilyName}
              />
            </div>
          </div>

          <label>Parent birthday</label>
          <BirthdaySelectField onChange={setParentBirthday} value={parentBirthday} />

          <h3>Australian address</h3>
          <label htmlFor="street-address">Street address</label>
          <input id="street-address" onChange={(event) => setStreetAddress(event.target.value)} value={streetAddress} />

          <div className="form-grid two-columns">
            <div>
              <label htmlFor="suburb">Suburb</label>
              <input id="suburb" onChange={(event) => setSuburb(event.target.value)} value={suburb} />
            </div>
            <div>
              <label htmlFor="state">State</label>
              <select id="state" onChange={(event) => setState(event.target.value)} value={state}>
                <option value="">Select state</option>
                {australianStates.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="postcode">Postcode</label>
          <input
            id="postcode"
            inputMode="numeric"
            maxLength={4}
            onChange={(event) => setPostcode(event.target.value.replace(/\D/g, ""))}
            pattern="[0-9]{4}"
            value={postcode}
          />

          <h3>Student information</h3>
          <div className="form-grid two-columns">
            <div>
              <label htmlFor="student-first-name">First name</label>
              <input
                id="student-first-name"
                onChange={(event) => setStudentFirstName(event.target.value)}
                required
                value={studentFirstName}
              />
            </div>
            <div>
              <label htmlFor="student-family-name">Family name</label>
              <input
                id="student-family-name"
                onChange={(event) => setStudentFamilyName(event.target.value)}
                required
                value={studentFamilyName}
              />
            </div>
          </div>

          <label>Student birthday</label>
          <BirthdaySelectField onChange={setStudentBirthday} value={studentBirthday} />

          <div className="form-grid two-columns">
            <div>
              <label htmlFor="student-gender">Gender</label>
              <select id="student-gender" onChange={(event) => setGender(event.target.value)} value={gender}>
                <option value="">Select gender</option>
                {genderOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="grade-level">Grade</label>
              <select id="grade-level" onChange={(event) => setGradeLevel(event.target.value)} value={gradeLevel}>
                <option value="">Select grade</option>
                {gradeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
