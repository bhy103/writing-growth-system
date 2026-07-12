import Link from "next/link";

export function RegisterPage() {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link className="text-button" href="/">
          Back to portal
        </Link>
        <p className="eyebrow">Create account</p>
        <h1>Register</h1>
        <p className="auth-intro">
          This is the first registration frame. Real account creation will be connected later.
        </p>

        <div className="auth-form">
          <label htmlFor="student-name">Student name</label>
          <input id="student-name" placeholder="Student name" />

          <label htmlFor="parent-email">Parent email</label>
          <input id="parent-email" placeholder="parent@example.com" type="email" />

          <label htmlFor="password">Password</label>
          <input id="password" placeholder="Create a password" type="password" />

          <Link className="primary-button large" href="/workspace">
            Create demo account
          </Link>
        </div>

        <p className="auth-footnote">
          Already have an account? <Link href="/workspace">Login</Link>
        </p>
      </section>
    </main>
  );
}
