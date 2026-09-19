import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({
  className,
  error,
  ref,
  ...props
}: InputProps & { ref?: React.Ref<HTMLInputElement> }) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border bg-white/5 px-4 py-2.5 text-white outline-none transition placeholder:text-white/30 focus:border-neon-magenta disabled:opacity-50",
        error ? "border-red-500/60" : "border-white/10",
        className
      )}
      {...props}
    />
  );
}
