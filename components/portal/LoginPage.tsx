"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { storageKey } from "@/lib/storage/prototype-storage";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await response.json();

    setIsSubmitting(false);

    if (!response.ok) {
      setMessage(result.message ?? "Login failed.");
      return;
    }

    window.localStorage.removeItem(storageKey);
    router.push(result.user?.profileComplete ? "/workspace" : "/profile-setup");
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="text-button" href="/">
          Back to portal
        </Link>
        <p className="eyebrow">Student login</p>
        <h1>Login</h1>
        <p className="auth-intro">Log in to continue your English writing practice.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@example.com"
            required
            type="email"
            value={email}
          />

          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />

          <button className="primary-button large" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
          {message && <p className="form-message error">{message}</p>}
        </form>

        <p className="auth-footnote">
          Need an account? <Link href="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}
