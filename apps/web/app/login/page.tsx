import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthShell
      eyebrow="KaraQueue"
      title="Welcome back"
      subtitle="Your songs. Your queue. Your stage."
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
