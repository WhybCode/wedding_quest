/** Cookie: ktorá stránka sa na zariadení otvorila ako prvá (full vs afterparty). */

export const ENTRY_COOKIE = "no-wedding-entry";
export const ENTRY_FULL = "full";
export const ENTRY_AFTERPARTY = "afterparty";

export type EntryVariant = typeof ENTRY_FULL | typeof ENTRY_AFTERPARTY;

/** ~1 rok — pokryje obdobie do svadby. */
const MAX_AGE_SEC = 60 * 60 * 24 * 400;

function cookiePath() {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return "/";
  return base.endsWith("/") ? base : `${base}/`;
}

export function readEntryCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ENTRY_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(ENTRY_COOKIE.length + 1)) || null;
}

/** Zapíše vstupnú stránku len ak ešte žiadna nie je zapamätaná (prvá návšteva vyhráva). */
export function rememberEntryIfUnset(entry: EntryVariant) {
  if (typeof document === "undefined") return;
  if (readEntryCookie()) return;

  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${ENTRY_COOKIE}=${encodeURIComponent(entry)}`,
    `Max-Age=${MAX_AGE_SEC}`,
    `Path=${cookiePath()}`,
    "SameSite=Lax",
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

export function shouldRedirectHomeToAfterparty() {
  return readEntryCookie() === ENTRY_AFTERPARTY;
}
