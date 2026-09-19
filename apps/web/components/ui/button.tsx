import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-neon-magenta text-white hover:brightness-110 focus-visible:outline-neon-magenta",
  secondary:
    "border border-white/20 text-white/90 hover:border-white/40 hover:text-white focus-visible:outline-white/40",
  ghost: "text-white/70 hover:bg-white/5 hover:text-white focus-visible:outline-white/40",
  danger:
    "border border-red-500/40 text-red-300 hover:bg-red-500/10 focus-visible:outline-red-400"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base"
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ref,
  ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}
