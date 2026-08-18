export function getSupabaseStorageKey(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = url.replace(/^https?:\/\//, "").split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

export function clearSupabaseAuthCookies(): void {
  if (typeof document === "undefined") {
    return;
  }
  const prefix = getSupabaseStorageKey();
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie.split("; ").forEach((part) => {
    const eq = part.indexOf("=");
    const name = eq >= 0 ? part.slice(0, eq) : part;
    const trimmed = name.trim();
    const isAuthCookie =
      trimmed === prefix ||
      trimmed.startsWith(`${prefix}.`) ||
      trimmed.startsWith(`${prefix}-`);
    if (isAuthCookie) {
      document.cookie = `${trimmed}=; Path=/; Max-Age=0; SameSite=Lax; expires=${expired}`;
    }
  });
}