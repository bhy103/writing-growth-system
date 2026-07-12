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

  return children;
}
