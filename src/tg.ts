// Thin wrapper over Telegram.WebApp (the SDK script is loaded from telegram.org in index.html).
interface WebApp {
  initData: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } };
  ready(): void; expand(): void; close(): void;
  openLink(url: string): void;
  colorScheme?: string;
  themeParams?: Record<string, string>;
  setHeaderColor?(c: string): void; setBackgroundColor?(c: string): void;
  BackButton?: { show(): void; hide(): void; onClick(f: () => void): void; offClick(f: () => void): void };
  HapticFeedback?: { impactOccurred(s: string): void; notificationOccurred(s: string): void };
  onEvent?(e: string, f: () => void): void;
}
declare global { interface Window { Telegram?: { WebApp?: WebApp } } }

export const wa: WebApp | undefined = window.Telegram?.WebApp;

export function initData(): string {
  if (wa?.initData) return wa.initData;
  // fallback: Telegram passes the data in the URL hash too
  const h = new URLSearchParams(location.hash.slice(1)).get("tgWebAppData");
  return h ?? "";
}

export function startTelegram(): void {
  try { wa?.ready(); wa?.expand(); wa?.setHeaderColor?.("#1e8c3f"); } catch { /* outside Telegram */ }
}
export const haptic = (): void => { try { wa?.HapticFeedback?.impactOccurred("light"); } catch { /* ignore */ } };
export function openLink(url: string): void {
  if (wa?.openLink) wa.openLink(url); else window.open(url, "_blank", "noopener");
}
export const tgUser = () => wa?.initDataUnsafe?.user;
