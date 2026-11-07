/** Only follows redirects inside this site, so a crafted link can't send someone elsewhere. */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
}
