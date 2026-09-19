import { cn } from "@/lib/cn";

type BadgeVariant = "neutral" | "premium" | "success" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-white/20 bg-white/5 text-white/70",
  premium:
    "border-neon-magenta/40 bg-gradient-to-r from-neon-magenta/20 to-neon-purple/20 text-white",
  success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  danger: "border-red-500/40 bg-red-500/10 text-red-300"
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
