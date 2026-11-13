import type { ComponentChildren } from "preact";
import { CHAIN_COLOR, iconOf } from "../chains";
import { go, pickMap, setPick, type Tab, view } from "../store";

export function ChainBadge({ code, name, size = 34 }: { code: string; name: string; size?: number }) {
  return (
    <span class="badge" style={{ background: CHAIN_COLOR[code] ?? "#1e8c3f", width: size, height: size, fontSize: size * 0.45 }}>
      {name.slice(0, 1)}
    </span>
  );
}

export function Thumb({ cat, src, size = 56, alt = "" }: { cat: number; src?: string | null; size?: number; alt?: string }) {
  if (src) return <img class="thumb photo" src={src} alt={alt} width={size} height={size} />;
  return <span class="thumb" style={{ width: size, height: size, fontSize: size * 0.5 }}>{iconOf(cat)}</span>;
}

export function Qty({ id, add = "Добавить", compact = false }: { id: number; add?: string; compact?: boolean }) {
  const q = pickMap.value.get(id)?.qty ?? 0;
  const stop = (f: () => void) => (e: Event) => { e.stopPropagation(); f(); };
  if (!q) {
    return <button class={`btn-add ${compact ? "sm" : ""}`} onClick={stop(() => setPick(id, 1))}>{add}</button>;
  }
  return (
    <div class="qty" onClick={(e) => e.stopPropagation()}>
      <button aria-label="Меньше" onClick={stop(() => setPick(id, q - 1))}>−</button>
      <b aria-live="polite">{q}</b>
      <button aria-label="Больше" onClick={stop(() => setPick(id, Math.min(99, q + 1)))}>+</button>
    </div>
  );
}

const ICONS: Record<Tab, string> = {
  home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  catalog: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  cart: "M3 4h2l2.4 11h10.2l2-8H6.2M9 20a1.2 1.2 0 1 0 0 .01M17 20a1.2 1.2 0 1 0 0 .01",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
};
const TABS: [Tab, string][] = [["home", "Главная"], ["catalog", "Каталог"], ["cart", "Корзина"], ["profile", "Профиль"]];

export function TabBar({ count }: { count: number }) {
  const cur = view.value.tab;
  return (
    <nav class="tabbar">
      {TABS.map(([t, label]) => (
        <button key={t} class={cur === t ? "on" : ""} onClick={() => go({ tab: t })}>
          <span class="ico">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d={ICONS[t]} /></svg>
            {t === "cart" && count > 0 && <i class="dot">{count}</i>}
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export function Header({ title, sub, back, right }: { title: string; sub?: string; back?: () => void; right?: ComponentChildren }) {
  return (
    <header class="hdr">
      {back ? <button class="back" onClick={back} aria-label="Назад">‹</button> : <span class="logo">SSA</span>}
      <div class="ttl"><h1>{title}</h1>{sub && <small>{sub}</small>}</div>
      {right}
    </header>
  );
}

export function Empty({ icon, title, text, children }: { icon: string; title: string; text?: string; children?: ComponentChildren }) {
  return <div class="empty"><div class="big">{icon}</div><h2>{title}</h2>{text && <p>{text}</p>}{children}</div>;
}
