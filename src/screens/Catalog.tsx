import { useMemo, useState } from "preact/hooks";
import { Empty, Header, Qty, Thumb } from "../components/ui";
import { money } from "../fmt";
import { iconOf } from "../chains";
import { buildItems, type CatalogItem } from "../lib/compare";
import { boot, data, go, pickMap, sheet, view } from "../store";

/** "от N ₽": the cheapest effective unit price among offers that fit the brand (pack size not scaled). */
function fromPrice(item: CatalogItem): number | null {
  const d = data.value;
  if (!d) return null;
  const p = pickMap.value.get(item.id);
  const [it] = buildItems(d, [{ catalog_id: item.id, qty: 1, brand: p?.brand ?? null }]);
  const lines = Object.values(it.offers).map((o) => o.line);
  return lines.length ? Math.min(...lines) : null;
}

export function ProductTile({ item }: { item: CatalogItem }) {
  const price = fromPrice(item);
  const p = pickMap.value.get(item.id);
  return (
    <div class={`tile ${p ? "picked" : ""}`} onClick={() => { sheet.value = item.id; }}>
      <Thumb cat={item.cat} size={64} />
      <div class="tname">{item.name}</div>
      <small class="muted">{[item.size, p?.brand].filter(Boolean).join(" · ") || "\u00a0"}</small>
      <div class="tprice">{price !== null ? <>от <b>{money(price)}</b></> : <span class="muted">нет цены</span>}</div>
      <Qty id={item.id} compact />
    </div>
  );
}

export function CategoryList() {
  const b = boot.value!;
  const count = useMemo(() => {
    const m = new Map<number, number>();
    for (const it of b.catalog.items) m.set(it.cat, (m.get(it.cat) ?? 0) + 1);
    return m;
  }, [b]);
  const picked = new Map<number, number>();
  for (const p of pickMap.value.values()) {
    const it = b.catalog.items.find((i) => i.id === p.catalog_id);
    if (it) picked.set(it.cat, (picked.get(it.cat) ?? 0) + 1);
  }
  return (
    <div class="cats">
      {[...b.catalog.categories].sort((a, c) => a.id - c.id).map((c) => (
        <button key={c.id} class="cat" onClick={() => go({ tab: "catalog", cat: c.id })}>
          <span class="cat-ico">{iconOf(c.id)}</span>
          <b>{c.name}</b>
          <small>{count.get(c.id) ?? 0} товаров{picked.get(c.id) ? ` · выбрано ${picked.get(c.id)}` : ""}</small>
        </button>
      ))}
    </div>
  );
}

export function Catalog() {
  const b = boot.value!;
  const [q, setQ] = useState("");
  const cat = view.value.cat;
  const needle = q.trim().toLowerCase().replace(/ё/g, "е");
  const hasPrice = (i: CatalogItem) => b.offers.some((o) => o.k === i.id);
  const list = b.catalog.items.filter((i) => (needle ? i.name.toLowerCase().replace(/ё/g, "е").includes(needle) : i.cat === cat))
    .sort((x, y) => Number(hasPrice(y)) - Number(hasPrice(x)) || x.name.localeCompare(y.name, "ru"));
  const title = needle ? "Поиск" : b.catalog.categories.find((c) => c.id === cat)?.name ?? "Каталог";
  const showList = !!needle || cat !== undefined;
  return (
    <>
      <Header title={showList ? title : "Каталог"} sub={showList ? `${list.length} товаров` : "Выберите, что вы обычно покупаете"}
        back={showList && !needle ? () => go({ tab: "catalog" }) : undefined} />
      <div class="search"><input type="search" placeholder="Найти товар" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} /></div>
      {!showList ? <CategoryList /> : list.length ? <div class="grid">{list.map((i) => <ProductTile key={i.id} item={i} />)}</div>
        : <Empty icon="🔍" title="Ничего не нашли" text="Попробуйте другое слово." />}
    </>
  );
}
