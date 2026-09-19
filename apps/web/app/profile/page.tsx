import { requireUser } from "@/lib/auth/require-user";
import { AppNav } from "@/components/app/app-nav";
import { ProfileForm } from "@/components/auth/profile-form";

export default async function ProfilePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, supabase } = await requireUser();
  const { error } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <AppNav active="profile" />

      <div className="flex flex-col items-center px-6 py-12">
        <h1 className="mb-8 text-3xl font-bold">Your profile</h1>

        {error === "delete_failed" && (
          <p className="mb-6 max-w-sm rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            Could not delete your account. Please try again.
          </p>
        )}

        <ProfileForm email={user.email ?? ""} displayName={profile?.display_name ?? ""} />
      </div>
    </main>
  );
}
