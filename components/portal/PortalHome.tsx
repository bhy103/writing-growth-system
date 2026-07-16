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

const subjectItems = ["Writing Coach", "Vocabulary Builder", "Math Mistake Book"];

export function PortalHome() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <Link className="portal-brand" href="/">
          <span className="brand-mark">C</span>
          <div>
            <strong>Family AI Coach</strong>
            <span>Premium learning support at home</span>
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
          <h1>A private AI coach for every learner in your family.</h1>
          <p>
            A refined learning workspace for Writing, Vocabulary, and Math, built around real
            student work, teacher-style feedback, printable practice, and steady progress.
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

        <div className="hero-product-preview premium-visual" aria-label="Family coach workspace preview">
          <div className="premium-visual-photo" aria-hidden="true">
            <div className="visual-tablet">
              <span />
              <span />
              <span />
            </div>
            <div className="visual-notebook">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="visual-pencil" />
          </div>
          <div className="hero-preview-top">
            <div>
              <span>Current learner</span>
              <strong>Lena Pan</strong>
            </div>
            <span className="status-pill">Live workspace</span>
          </div>
          <div className="hero-feedback-grid">
            <div>
              <span>Today</span>
              <strong>Writing</strong>
            </div>
            <div>
              <span>Next pack</span>
              <strong>Vocabulary</strong>
            </div>
          </div>
          <div className="hero-note-card">
            Upload real work, receive focused guidance, and keep every student&apos;s learning record
            in one family account.
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
          <span>Writing, Vocabulary, and Math each have a dedicated workspace.</span>
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
            Each subject has its own tools, but the experience stays consistent: clear feedback,
            useful practice, printable review, and student-level progress.
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
            improving, and what should be reviewed next.
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
          <h2>A polished workspace for subject-by-subject growth.</h2>
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
