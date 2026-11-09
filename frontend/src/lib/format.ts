export function formatVideoNumber(number: string | number): string {
  const value = String(number).trim();
  if (/^\d+$/.test(value)) return value.padStart(2, "0");
  return value;
}

export function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const secondText = String(secs).padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${secondText}`;
  }

  return `${minutes}:${secondText}`;
}
