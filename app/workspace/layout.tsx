import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/session";

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

  return children;
}
