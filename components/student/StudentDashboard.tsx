import Link from "next/link";

export function StudentDashboard() {
  return (
    <section className="view active-view" data-testid="view-dashboard">
      <div className="hero-band">
        <div>
          <p className="eyebrow">Today</p>
          <h2>Build one stronger English draft.</h2>
          <p>Start with your own ideas. The AI coach will help you revise without writing the essay for you.</p>
        </div>
        <Link className="primary-button large" href="/workspace/new-writing">
          Start
        </Link>
      </div>
    </section>
  );
}
