export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || Number.isNaN(seconds)) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
