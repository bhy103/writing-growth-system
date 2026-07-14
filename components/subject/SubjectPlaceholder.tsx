type SubjectPlaceholderProps = {
  title: string;
  eyebrow: string;
  description: string;
  comingNext: string[];
};

export function SubjectPlaceholder({ title, eyebrow, description, comingNext }: SubjectPlaceholderProps) {
  return (
    <section className="view active-view subject-placeholder">
      <div className="subject-hero panel">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="subject-plan-grid">
        {comingNext.map((item, index) => (
          <article className="panel subject-plan-card" key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
