import { AppShell } from "@/components/app-shell/AppShell";
import { SubjectPlaceholder } from "@/components/subject/SubjectPlaceholder";

export default function MathWorkspacePage() {
  return (
    <AppShell activeView="math">
      <SubjectPlaceholder
        eyebrow="Subject coach"
        title="Math Coach"
        description="A dedicated math workspace will guide students through problem solving, worked examples, mistake patterns, and short practice sets."
        comingNext={[
          "Upload or type math questions",
          "Step-by-step reasoning feedback",
          "Mistake pattern tracking",
          "Daily practice by topic",
        ]}
      />
    </AppShell>
  );
}
