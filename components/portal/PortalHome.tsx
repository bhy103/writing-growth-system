import Link from "next/link";

const workflowSteps = [
  {
    label: "Submit",
    title: "Upload or type a draft",
    body: "Students can type directly, take a photo, upload an image, or upload a document.",
  },
  {
    label: "Review",
    title: "Confirm the extracted text",
    body: "Students check the text before feedback starts, so the writing stays accurate.",
  },
  {
    label: "Improve",
    title: "Revise with focused guidance",
    body: "The workspace gives one clear next step across ideas, structure, vocabulary, and fluency.",
  },
];

const skillItems = ["Ideas", "Organization", "Vocabulary", "Grammar", "Sentence Fluency", "Mechanics"];

export function PortalHome() {
  return (
    <main className="portal-page">
      <header className="portal-nav">
        <Link className="portal-brand" href="/">
          <span className="brand-mark">W</span>
          <div>
            <strong>Writing Growth System</strong>
            <span>English writing improvement for students</span>
          </div>
        </Link>
        <nav className="portal-menu" aria-label="Portal navigation">
          <a href="#workflow">Workflow</a>
          <a href="#skills">Skills</a>
          <a href="#preview">Preview</a>
        </nav>
        <div className="portal-actions">
          <Link className="secondary-button" href="/workspace">
            Login
          </Link>
          <Link className="primary-button" href="/register">
            Register
          </Link>
        </div>
      </header>

      <section className="portal-hero-stage">
        <div className="portal-hero-content">
          <p className="eyebrow">English Writing Growth Platform</p>
          <h1>Turn every English draft into a clear next step.</h1>
          <p>
            A focused student workspace for writing submission, text review, skill-based feedback,
            revision practice, and progress tracking.
          </p>
          <div className="portal-cta-row">
            <Link className="primary-button large" href="/workspace">
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
              <span>Current draft</span>
              <strong>A Memorable Day</strong>
            </div>
            <span className="status-pill">Ready</span>
          </div>
          <div className="hero-draft-card">
            <span className="scene-line wide" />
            <span className="scene-line" />
            <span className="scene-line short" />
            <strong>Writing focus: Sentence Fluency</strong>
          </div>
          <div className="hero-feedback-grid">
            <div>
              <span>Strongest skill</span>
              <strong>Ideas</strong>
            </div>
            <div>
              <span>Next focus</span>
              <strong>Sentence Fluency</strong>
            </div>
          </div>
          <div className="hero-note-card">
            Try combining two short sentences with because, when, or after.
          </div>
        </div>
      </section>

      <section className="portal-section portal-summary-strip" aria-label="Product highlights">
        <div>
          <strong>English-first</strong>
          <span>All student feedback and coaching focus on English writing improvement.</span>
        </div>
        <div>
          <strong>Upload-ready</strong>
          <span>Photo, image, document, and direct typing entries are already framed.</span>
        </div>
        <div>
          <strong>Progress-focused</strong>
          <span>Students see writing strengths, next focus areas, and revision history.</span>
        </div>
      </section>

      <section className="portal-section portal-two-column" id="skills">
        <div>
          <p className="eyebrow">For Students</p>
          <h2>Practice English writing inside one focused workspace.</h2>
          <p>
            Students move from draft to report to revision while the system keeps attention on one
            practical writing skill at a time.
          </p>
          <div className="skill-cloud">
            {skillItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="parent-language-panel">
          <p className="eyebrow">For Families</p>
          <h3>Clear progress without rewriting the draft.</h3>
          <p>
            The system helps families understand what the student is practicing while keeping the
            actual writing, feedback, and revision workflow centered on English.
          </p>
        </div>
      </section>

      <section className="portal-section" id="workflow">
        <div className="section-heading">
          <p className="eyebrow">Workflow</p>
          <h2>From submission to revision in three clear moves.</h2>
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
          <h2>A complete student writing workspace is already in place.</h2>
        </div>
        <div className="portal-product-frame">
          <div className="product-sidebar">
            <strong>Writing Growth</strong>
            <span className="active">Dashboard</span>
            <span>New Writing</span>
            <span>AI Report</span>
            <span>Revision</span>
          </div>
          <div className="product-main">
            <div className="product-topline">
              <div>
                <span>Current draft</span>
                <strong>A Memorable Day</strong>
              </div>
              <Link className="primary-button" href="/workspace">
                Open Workspace
              </Link>
            </div>
            <div className="product-panels">
              <div>
                <span>Strongest skill</span>
                <strong>Ideas</strong>
                <p>Your main idea is clear and includes a personal detail.</p>
              </div>
              <div>
                <span>Next focus</span>
                <strong>Sentence Fluency</strong>
                <p>Try combining two short sentences with because, when, or after.</p>
              </div>
              <div>
                <span>Revision goal</span>
                <strong>One clear improvement</strong>
                <p>Make the next draft stronger without replacing the student&apos;s own voice.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
