"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { getPasswordIssues, isStrongPassword } from "@/lib/auth/password-policy";
import { storageKey } from "@/lib/storage/prototype-storage";

export function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordIssues = getPasswordIssues(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isStrongPassword(password) && passwordsMatch && Boolean(email);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("Please complete the password requirements before creating an account.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword }),
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
          <div className="password-field">
            <input
              id="password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button className="secondary-button" onClick={() => setShowPassword((current) => !current)} type="button">
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Enter password again"
            required
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
          />

          <div className={`password-strength ${password && passwordIssues.length === 0 ? "strong" : ""}`}>
            <strong>{passwordIssues.length === 0 && password ? "Strong password" : "Password must include:"}</strong>
            {passwordIssues.length > 0 && (
              <span>8+ characters, uppercase, lowercase, number, and symbol.</span>
            )}
            {confirmPassword && !passwordsMatch && <span>Passwords do not match.</span>}
          </div>

          <button className="primary-button large" disabled={isSubmitting || !canSubmit} type="submit">
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
