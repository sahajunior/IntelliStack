export function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export function splitDisplayName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Display name is required.");
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ") || null,
  };
}
