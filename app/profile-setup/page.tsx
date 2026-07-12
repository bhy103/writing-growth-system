import { redirect } from "next/navigation";
import { ProfileSetupPage } from "@/components/profile/ProfileSetupPage";
import { getCurrentUser } from "@/lib/auth/session";

export default async function ProfileSetup() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <ProfileSetupPage />;
}
