export function formatCad(value: number | null | undefined, compact = false) {
  if (!value) return "Not available";
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(value);
}
