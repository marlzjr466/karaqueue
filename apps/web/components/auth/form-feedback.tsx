export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return <p className="mt-1 text-sm text-red-400">{messages[0]}</p>;
}

export function FormMessage({
  success,
  message
}: {
  success?: boolean;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm ${
        success
          ? "border-neon-blue/40 bg-neon-blue/10 text-neon-blue"
          : "border-red-500/40 bg-red-500/10 text-red-300"
      }`}
    >
      {message}
    </p>
  );
}
