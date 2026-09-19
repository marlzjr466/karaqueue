import { requireUser } from "@/lib/auth/require-user";
import { getUserQueue } from "@/lib/queue/get-queue";
import { QueueScreen } from "@/components/player/queue-screen";

export default async function QueuePage() {
  const { user, supabase } = await requireUser();

  const [items, { data: entitlements }] = await Promise.all([
    getUserQueue(supabase, user.id),
    supabase.from("user_entitlements").select("*").eq("user_id", user.id).single()
  ]);

  const limit = entitlements?.max_queue_items ?? 15;
  const nowPlaying = items.find((i) => i.status === "playing") ?? null;
  const upNext = items.filter((i) => i.status === "queued");

  return (
    <main className="min-h-screen bg-stage-gradient text-white">
      <QueueScreen
        initialNowPlaying={nowPlaying}
        initialUpNext={upNext}
        queueLimit={limit}
      />
    </main>
  );
}
