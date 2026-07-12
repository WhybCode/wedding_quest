/** Cesty k statickým súborom — rešpektujú Vite `base` (GitHub Pages: /wedding_quest/). */
export function sitePath(relativePath = "") {
  const base = import.meta.env.BASE_URL;
  return `${base}${relativePath.replace(/^\//, "")}`;
}
