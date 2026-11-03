import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

// Same behaviour as the login page: someone who's already signed in has no
// use for this screen, so send them on.
export default async function ResetPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // Read here on the server so the secret itself never reaches the browser —
  // the form only learns whether the feature is switched on.
  const enabled = !!process.env.RESET_KEY;

  return <ResetPasswordForm enabled={enabled} />;
}
