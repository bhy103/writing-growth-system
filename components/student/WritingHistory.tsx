import Link from "next/link";

type HistoryItem = {
  id?: string;
  title: string;
  status: string;
  focus: string;
};

type WritingHistoryProps = {
  history: HistoryItem[];
};

export function WritingHistory({ history }: WritingHistoryProps) {
  return (
    <section className="view active-view" data-testid="view-history">
      <section className="panel">
        <h3>All Writing</h3>
        <div className="history-table" data-testid="history-table">
          <div className="history-head">
            <span>Title</span>
            <span>Status</span>
            <span>Focus</span>
            <span>Action</span>
          </div>
          {history.map((item, index) => (
            <div className="history-row" key={item.id ?? `${item.title}-${index}`}>
              <span>{item.title}</span>
              <strong>{item.status}</strong>
              <span>{item.focus}</span>
              <Link className="small-button" href={item.id ? `/workspace/history/${item.id}` : "/workspace/report"}>
                Open
              </Link>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
