import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center",
        className
      )}
    >
      {icon ? <div className="mb-4 text-4xl">{icon}</div> : null}
      <p className="text-lg font-semibold text-white">{title}</p>
      {description ? (
        <p className="mt-2 max-w-xs text-sm text-white/50">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
