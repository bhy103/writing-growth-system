import { AppShell } from "@/components/app-shell/AppShell";
import { SubjectPlaceholder } from "@/components/subject/SubjectPlaceholder";

export default function VocabularyWorkspacePage() {
  return (
    <AppShell activeView="vocabulary">
      <SubjectPlaceholder
        eyebrow="Subject coach"
        title="Vocabulary Coach"
        description="A dedicated vocabulary workspace will help each student grow word knowledge, word choice, spelling patterns, and sentence usage."
        comingNext={[
          "Personal word bank by student",
          "AI word practice from writing mistakes",
          "Spelling and usage exercises",
          "Vocabulary progress history",
        ]}
      />
    </AppShell>
  );
}
