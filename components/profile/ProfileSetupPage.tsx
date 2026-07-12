"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
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

function toNativeDateValue(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  const parsed = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCDate() !== Number(day) ||
    parsed.getUTCMonth() + 1 !== Number(month) ||
    parsed.getUTCFullYear() !== Number(year)
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function fromNativeDateValue(value: string) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function DatePickerField({
  id,
  onChange,
  value,
}: {
  id: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const nativeInputRef = useRef<HTMLInputElement>(null);

  function openCalendar() {
    const nativeInput = nativeInputRef.current;

    if (!nativeInput) {
      return;
    }

    if (typeof nativeInput.showPicker === "function") {
      nativeInput.showPicker();
      return;
    }

    nativeInput.click();
  }

  return (
    <div className="date-picker-field">
      <input
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(event.target.value)}
        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
        placeholder="DD/MM/YYYY"
        value={value}
      />
      <button aria-label="Open calendar" className="date-picker-button" onClick={openCalendar} type="button">
        <svg aria-hidden="true" fill="none" height="22" viewBox="0 0 24 24" width="22">
          <path
            d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
      </button>
      <input
        aria-hidden="true"
        className="native-date-input"
        onChange={(event) => onChange(fromNativeDateValue(event.target.value))}
        ref={nativeInputRef}
        tabIndex={-1}
        type="date"
        value={toNativeDateValue(value)}
      />
    </div>
  );
}

export function ProfileSetupPage() {
  const router = useRouter();
  const [parentName, setParentName] = useState("");
  const [parentBirthday, setParentBirthday] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [studentName, setStudentName] = useState("");
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
        parentName,
        parentBirthday,
        streetAddress,
        suburb,
        state,
        postcode,
        studentName,
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
          <label htmlFor="parent-name">Parent name</label>
          <input id="parent-name" onChange={(event) => setParentName(event.target.value)} required value={parentName} />

          <label htmlFor="parent-birthday">Parent birthday</label>
          <DatePickerField id="parent-birthday" onChange={setParentBirthday} value={parentBirthday} />

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
          <label htmlFor="student-name">Student name</label>
          <input id="student-name" onChange={(event) => setStudentName(event.target.value)} required value={studentName} />

          <label htmlFor="student-birthday">Student birthday</label>
          <DatePickerField id="student-birthday" onChange={setStudentBirthday} value={studentBirthday} />

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
