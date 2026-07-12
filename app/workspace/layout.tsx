import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { WorkspaceAccountProvider } from "@/components/app-shell/WorkspaceAccountContext";
import { getCurrentStudentId, getCurrentUser } from "@/lib/auth/session";

type WorkspaceLayoutProps = {
  children: ReactNode;
};

export default async function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.accountProfile || user.studentProfiles.length === 0) {
    redirect("/profile-setup");
  }

  const currentStudentId = await getCurrentStudentId();

  return (
    <WorkspaceAccountProvider
      currentStudentId={currentStudentId ?? user.studentProfiles[0]?.id ?? ""}
      email={user.email}
      students={user.studentProfiles.map((student) => ({
        id: student.id,
        displayName: student.displayName,
      }))}
    >
      {children}
    </WorkspaceAccountProvider>
  );
}
