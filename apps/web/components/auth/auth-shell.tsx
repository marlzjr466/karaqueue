export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stage-gradient px-6 py-16">
      <div className="mb-8 text-center">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-neon-blue">
          {eyebrow}
        </p>
        <h1 className="bg-gradient-to-r from-neon-magenta via-neon-purple to-neon-blue bg-clip-text text-3xl font-bold text-transparent">
          {title}
        </h1>
        <p className="mt-2 text-sm text-white/50">{subtitle}</p>
      </div>
      {children}
    </main>
  );
}
