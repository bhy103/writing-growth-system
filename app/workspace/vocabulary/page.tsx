import { AppShell } from "@/components/app-shell/AppShell";
import { VocabularyCoach } from "@/components/vocabulary/VocabularyCoach";

export default function VocabularyWorkspacePage() {
  return (
    <AppShell activeView="vocabulary">
      <VocabularyCoach />
    </AppShell>
  );
}
