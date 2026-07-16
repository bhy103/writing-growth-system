import { AppShell } from "@/components/app-shell/AppShell";
import { MathMistakeBook } from "@/components/math/MathMistakeBook";

export default function MathWorkspacePage() {
  return (
    <AppShell activeView="math">
      <MathMistakeBook />
    </AppShell>
  );
}
