"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { storageKey } from "@/lib/storage/prototype-storage";

export function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.message ?? "Registration failed.");
      return;
    }

    window.localStorage.removeItem(storageKey);
    router.push("/profile-setup");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="text-button" href="/">
          Back to portal
        </Link>
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <p className="auth-intro">Create an account first. Family and student profiles come next.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="student-email">Email</label>
          <input
            id="student-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            required
            type="email"
            value={email}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            required
            type="password"
            value={password}
          />

          <button className="primary-button large" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
          {message && <p className="form-message error">{message}</p>}
        </form>

        <p className="auth-footnote">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
