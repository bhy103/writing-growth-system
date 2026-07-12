"use client";

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

type BirthdaySelectFieldProps = {
  onChange: (value: string) => void;
  value: string;
};

export function BirthdaySelectField({ onChange, value }: BirthdaySelectFieldProps) {
  const { day, month, year } = getDateParts(value);

  function updatePart(part: "day" | "month" | "year", nextValue: string) {
    onChange(
      formatDateParts(
        part === "day" ? nextValue : day === "00" ? "" : day,
        part === "month" ? nextValue : month === "00" ? "" : month,
        part === "year" ? nextValue : year === "0000" ? "" : year,
      ),
    );
  }

  return (
    <div className="date-picker-field">
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
