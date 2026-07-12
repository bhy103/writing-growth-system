"use client";

import { useRouter } from "next/navigation";
import { type ClipboardEvent, type FormEvent, type KeyboardEvent, useState } from "react";

const australianStates = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];
const parentTitleOptions = ["Mr", "Mrs", "Ms", "Miss", "Dr", "Mx"];
const monthOptions = [
  { label: "Jan", value: "01" },
  { label: "Feb", value: "02" },
  { label: "Mar", value: "03" },
  { label: "Apr", value: "04" },
  { label: "May", value: "05" },
  { label: "Jun", value: "06" },
  { label: "Jul", value: "07" },
  { label: "Aug", value: "08" },
  { label: "Sep", value: "09" },
  { label: "Oct", value: "10" },
  { label: "Nov", value: "11" },
  { label: "Dec", value: "12" },
];
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
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1919 }, (_, index) => String(currentYear - index));
const dayOptions = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, "0"));

function getDateParts(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return { day: "", month: "", year: "" };
  }

  const [, day, month, year] = match;
  return { day, month, year };
}

function formatDateParts(day: string, month: string, year: string) {
  if (!day && !month && !year) {
    return "";
  }

  return `${day || "00"}/${month || "00"}/${year || "0000"}`;
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (!digits) {
    return "";
  }

  const padded = digits.padEnd(8, "0");
  return `${padded.slice(0, 2)}/${padded.slice(2, 4)}/${padded.slice(4, 8)}`;
}

function getEnteredDateDigits(value: string) {
  const { day, month, year } = getDateParts(value);

  if (!day && !month && !year) {
    return "";
  }

  return `${day}${month}${year}`.replace(/0+$/, "");
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
  const { day, month, year } = getDateParts(value);
  const [enteredDigits, setEnteredDigits] = useState(() => getEnteredDateDigits(value));

  function updatePart(part: "day" | "month" | "year", nextValue: string) {
    const nextFormatted = formatDateParts(
      part === "day" ? nextValue : day === "00" ? "" : day,
      part === "month" ? nextValue : month === "00" ? "" : month,
      part === "year" ? nextValue : year === "0000" ? "" : year,
    );

    setEnteredDigits(getEnteredDateDigits(nextFormatted));
    onChange(nextFormatted);
  }

  function updateTypedDigits(nextDigits: string) {
    const trimmedDigits = nextDigits.slice(0, 8);
    setEnteredDigits(trimmedDigits);
    onChange(formatDateInput(trimmedDigits));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      updateTypedDigits(`${enteredDigits}${event.key}`);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      updateTypedDigits(enteredDigits.slice(0, -1));
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    updateTypedDigits(`${enteredDigits}${event.clipboardData.getData("text").replace(/\D/g, "")}`);
  }

  return (
    <div className="date-picker-field">
      <input
        id={id}
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => updateTypedDigits(event.target.value.replace(/\D/g, ""))}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        pattern="[0-9]{2}/[0-9]{2}/[0-9]{4}"
        placeholder="DD/MM/YYYY"
        value={value}
      />
      <div className="date-wheel-grid">
        <select aria-label="Year" onChange={(event) => updatePart("year", event.target.value)} value={year === "0000" ? "" : year}>
          <option value="">Year</option>
          {yearOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select aria-label="Month" onChange={(event) => updatePart("month", event.target.value)} value={month === "00" ? "" : month}>
          <option value="">Month</option>
          {monthOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <select aria-label="Day" onChange={(event) => updatePart("day", event.target.value)} value={day === "00" ? "" : day}>
          <option value="">Day</option>
          {dayOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

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
