import { type MockReport } from "@/lib/mock/mock-analysis";

type ParentSummary = {
  main: string;
  support: string;
};

type ParentProgressViewProps = {
  report: MockReport;
  parentSummary: ParentSummary;
};

export function ParentProgressView({ report, parentSummary }: ParentProgressViewProps) {
  return (
    <section className="view active-view" data-testid="view-parent">
      <div className="parent-layout">
        <section className="panel parent-summary">
          <p className="eyebrow">Family summary</p>
          <h3>English Writing Progress Summary</h3>
          <p>{parentSummary.main}</p>
          <p>{parentSummary.support}</p>
        </section>
        <section className="panel">
          <h3>Growth Focus</h3>
          <div className="focus-list" data-testid="parent-focus-list">
            {report.dimensions.map((dimension) => (
              <div key={dimension.key}>
                <span>{dimension.name}</span>
                <strong>{dimension.key === report.weakest.key ? "Practice next" : dimension.level}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
