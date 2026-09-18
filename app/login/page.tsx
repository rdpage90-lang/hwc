import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

// If someone with a valid session lands here anyway — a bookmark, browser
// history, a shared link — send them straight through rather than making
// them stare uselessly at a login form they don't need.
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return <LoginForm />;
}
