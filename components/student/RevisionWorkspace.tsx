import Link from "next/link";
import { suggestRevision } from "@/lib/mock/mock-analysis";

type RevisionWorkspaceProps = {
  draft: string;
  onSaveRevision: () => void;
};

export function RevisionWorkspace({ draft }: RevisionWorkspaceProps) {
  return (
    <section className="view active-view" data-testid="view-revision">
      <section className="revision-layout">
        <div className="panel">
          <h3>Original Draft</h3>
          <p className="draft-text">{draft}</p>
        </div>
        <div className="panel editor-panel">
          <h3>Revised Draft</h3>
          <textarea defaultValue={suggestRevision(draft)} />
          <Link className="secondary-button" data-testid="save-revision" href="/workspace/parent">
            Save Revision
          </Link>
        </div>
      </section>
    </section>
  );
}
