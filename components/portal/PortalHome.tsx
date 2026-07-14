import Link from "next/link";

const workflowSteps = [
  {
    label: "Choose",
    title: "Pick a subject coach",
    body: "Families can guide learning through Writing, Vocabulary, and Math workspaces.",
  },
  {
    label: "Practice",
    title: "Submit real student work",
    body: "Students can type, upload, or work through short tasks while the coach tracks patterns.",
  },
  {
    label: "Grow",
    title: "Get one clear next step",
    body: "The system focuses on achievable feedback, practice, and long-term learning growth.",
  },
];

const subjectItems = ["Writing", "Vocabulary", "Math"];

export function PortalHome() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <Link className="portal-brand" href="/">
          <span className="brand-mark">C</span>
          <div>
            <strong>Family Coach System</strong>
            <span>Personal learning coach for students</span>
          </div>
        </Link>
        <nav className="portal-menu" aria-label="Portal navigation">
          <a href="#workflow">Workflow</a>
          <a href="#skills">Subjects</a>
          <a href="#preview">Preview</a>
        </nav>
        <div className="portal-actions">
          <Link className="secondary-button" href="/login">
            Login
          </Link>
          <Link className="primary-button" href="/register">
            Register
          </Link>
        </div>
      </header>

      <section className="portal-hero-stage">
        <div className="portal-hero-content">
          <p className="eyebrow">Personal Family Coach Platform</p>
          <h1>One calm learning coach for every child at home.</h1>
          <p>
            A family learning system for Writing, Vocabulary, and Math, built around student work,
            helpful feedback, short practice, and steady progress.
          </p>
          <div className="portal-cta-row">
            <Link className="primary-button large" href="/login">
              Login
            </Link>
            <Link className="secondary-button large" href="/register">
              Register
            </Link>
          </div>
        </div>

        <div className="hero-product-preview" aria-label="Workspace preview">
          <div className="hero-preview-top">
            <div>
              <span>Current student</span>
              <strong>Lena Pan</strong>
            </div>
            <span className="status-pill">Ready</span>
          </div>
          <div className="hero-draft-card">
            <span className="scene-line wide" />
            <span className="scene-line" />
            <span className="scene-line short" />
            <strong>Today: Writing Coach</strong>
          </div>
          <div className="hero-feedback-grid">
            <div>
              <span>Active subject</span>
              <strong>Writing</strong>
            </div>
            <div>
              <span>Next subject</span>
              <strong>Vocabulary</strong>
            </div>
          </div>
          <div className="hero-note-card">
            Each subject gives one practical next step for the student.
          </div>
        </div>
      </section>

      <section className="portal-section portal-summary-strip" aria-label="Product highlights">
        <div>
          <strong>Family-first</strong>
          <span>One account can support multiple students and subjects.</span>
        </div>
        <div>
          <strong>Subject-based</strong>
          <span>Writing is live first, with Vocabulary and Math ready as dedicated spaces.</span>
        </div>
        <div>
          <strong>Progress-focused</strong>
          <span>Students see strengths, next focus areas, and practice history over time.</span>
        </div>
      </section>

      <section className="portal-section portal-two-column" id="skills">
        <div>
          <p className="eyebrow">For Students</p>
          <h2>Move between subjects without losing the learning thread.</h2>
          <p>
            Each subject has its own workspace, but the coaching style stays consistent: clear,
            friendly, and focused on one next step.
          </p>
          <div className="skill-cloud">
            {subjectItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="parent-language-panel">
          <p className="eyebrow">For Families</p>
          <h3>Clear progress across the whole family.</h3>
          <p>
            The system helps families understand what each student is practicing, where they are
            improving, and what the next small learning step should be.
          </p>
        </div>
      </section>

      <section className="portal-section" id="workflow">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>From subject choice to steady progress in three clear moves.</h2>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map((step) => (
            <article className="workflow-card" key={step.label}>
              <span>{step.label}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-section product-preview-section" id="preview">
        <div className="section-heading">
          <p className="eyebrow">Workspace Preview</p>
          <h2>A family coach workspace with subject-by-subject growth.</h2>
        </div>
        <div className="portal-product-frame">
          <div className="product-sidebar">
            <strong>Family Coach</strong>
            <span className="active">Writing</span>
            <span>Vocabulary</span>
            <span>Math</span>
            <span>Settings</span>
          </div>
          <div className="product-main">
            <div className="product-topline">
              <div>
                <span>Current student</span>
                <strong>Lena Pan</strong>
              </div>
              <Link className="primary-button" href="/workspace">
                Open Workspace
              </Link>
            </div>
            <div className="product-panels">
              <div>
                <span>Writing</span>
                <strong>Ready</strong>
                <p>Upload drafts, get teacher-style feedback, and revise with one clear target.</p>
              </div>
              <div>
                <span>Vocabulary</span>
                <strong>Coming next</strong>
                <p>Build word banks from each student&apos;s real writing and reading needs.</p>
              </div>
              <div>
                <span>Math</span>
                <strong>Coming next</strong>
                <p>Track problem-solving patterns and practice small topic-based skills.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
