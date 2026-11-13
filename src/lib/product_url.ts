// Canonical https product URL, or the chain's public search page. No custom schemes.
const HOSTS: Record<string, string[]> = {
  lenta: ["lenta.com", "www.lenta.com"],
  magnit: ["magnit.ru", "www.magnit.ru"],
  vkusvill: ["vkusvill.ru", "www.vkusvill.ru"],
  dixy: ["dixy.ru", "www.dixy.ru"],
  pyaterochka: ["5ka.ru", "www.5ka.ru"],
  perekrestok: ["www.perekrestok.ru", "perekrestok.ru"],
};
const SEARCH: Record<string, string> = {
  lenta: "https://lenta.com/search?search={q}",
  magnit: "https://magnit.ru/search?term={q}",
  vkusvill: "https://vkusvill.ru/search/?q={q}",
  dixy: "https://dixy.ru/search/?q={q}",
  pyaterochka: "https://5ka.ru/search/?keyword={q}",
  perekrestok: "https://www.perekrestok.ru/cat/search?search={q}",
};
const ORIGIN: Record<string, string> = {
  lenta: "https://lenta.com", magnit: "https://magnit.ru", vkusvill: "https://vkusvill.ru",
  dixy: "https://dixy.ru", pyaterochka: "https://5ka.ru", perekrestok: "https://www.perekrestok.ru",
};

export function searchUrl(chain: string, name: string | null | undefined): string {
  const q = encodeURIComponent((name || "").trim());
  const tmpl = SEARCH[chain];
  if (!tmpl || !q) return ORIGIN[chain] || "https://lenta.com";
  return tmpl.replace("{q}", q);
}

export function productUrl(chain: string, url: string | null | undefined, name?: string | null): string {
  let raw = (url || "").trim();
  if (raw.startsWith("//")) raw = "https:" + raw;
  try {
    const p = new URL(raw);
    const host = p.hostname.toLowerCase();
    if (p.protocol === "https:" && (HOSTS[chain] || []).includes(host)) {
      let path = p.pathname || "/";
      if (chain === "magnit") return "https://magnit.ru" + path;
      if (chain === "vkusvill") {
        if (path.endsWith(".html")) path = path.slice(0, -5);
        if (!path.endsWith("/")) path += "/";
        return "https://vkusvill.ru" + path;
      }
      if (chain === "lenta") return "https://lenta.com" + (path.endsWith("/") ? path : path + "/");
      if (chain === "perekrestok") return "https://www.perekrestok.ru" + path.replace(/\/$/, "");
      if (chain === "dixy") return "https://dixy.ru" + (path.endsWith("/") ? path : path + "/");
      if (chain === "pyaterochka") return "https://5ka.ru" + (path.endsWith("/") ? path : path + "/");
      return `https://${host}${path}`;
    }
  } catch { /* invalid URL */ }
  return searchUrl(chain, name || "");
}

/** Preposition + chain name in the prepositional case: «в Магните», «во ВкусВилле». */
export function inChain(prepName: string): string {
  return (prepName.startsWith("В") || prepName.startsWith("в") ? "во " : "в ") + prepName;
}
