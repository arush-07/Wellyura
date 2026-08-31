export function safeAuthNext(
  value: string | string[] | undefined,
  fallback = "/workspace",
) {
  const raw =
    typeof value === "string"
      ? value
      : "";

  if (
    !raw.startsWith("/") ||
    raw.startsWith("//") ||
    raw.includes("\\")
  ) {
    return fallback;
  }

  try {
    const base =
      "https://wellyura.local";

    const url =
      new URL(raw, base);

    if (url.origin !== base) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
