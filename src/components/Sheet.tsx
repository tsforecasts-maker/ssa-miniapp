import { money } from "../fmt";
import { buildItems, freshnessLabel } from "../lib/compare";
import { Qty, ChainBadge, Thumb } from "./ui";
import { data, pickMap, setPick, sheet } from "../store";

/** Product card: prices per chain, brand choice, quantity. (Assistant rule — step 3.) */
export function Sheet() {
  const id = sheet.value, d = data.value;
  if (id === null || !d) return null;
  const item = d.items.find((i) => i.id === id);
  if (!item) return null;
  const pick = pickMap.value.get(id);
  const [it] = buildItems(d, [{ catalog_id: id, qty: pick?.qty ?? 1, brand: pick?.brand ?? null }]);
  const rows = d.rules.chains.filter((c) => it.offers[c.code]).map((c) => ({ c, o: it.offers[c.code] }))
    .sort((a, b) => a.o.line - b.o.line);
  const cheapest = rows[0]?.o.line;
  const brand = pick?.brand ?? null;
  const close = () => { sheet.value = null; };
  return (
    <div class="sheet-bg" onClick={close}>
      <div class="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <span class="grab" />
        <div class="sheet-top">
          <Thumb cat={item.cat} size={72} />
          <div><h2>{item.name}</h2><small>{item.size ?? ""}{item.brand ? ` · ${item.brand}` : ""}</small></div>
        </div>
        {!item.brand && item.brands.length > 0 && (
          <>
            <h3>Марка</h3>
            <div class="chips">
              {["", ...item.brands].map((b) => (
                <button key={b} class={`chip ${(brand ?? "") === b ? "on" : ""}`} onClick={() => setPick(id, pick?.qty ?? 1, b || null)}>
                  {b || "Любая марка"}
                </button>
              ))}
            </div>
          </>
        )}
        <h3>Цены в вашем районе</h3>
        {rows.length === 0 && <p class="muted">Пока нет подходящего предложения в магазинах района.</p>}
        {rows.map(({ c, o }) => (
          <div class="chain-row" key={c.code}>
            <ChainBadge code={c.code} name={c.name} size={30} />
            <div class="grow">
              <b>{c.name}</b>
              <small>{[o.basis === "card" ? "по карте" : o.basis === "card_assumed" ? "цена по карте" : o.basis === "promo" ? "акция" : "",
                freshnessLabel(d.rules, c.code, o.at)].filter(Boolean).join(" · ")}</small>
            </div>
            <div class="price">{money(o.line)}{o.qty !== 1 && <small> × {o.qty}</small>}{o.line === cheapest && rows.length > 1 && <i class="best">дешевле</i>}</div>
          </div>
        ))}
        <div class="sheet-foot">
          <Qty id={id} add="Добавить в список" />
          <button class="btn-primary" onClick={close}>Готово</button>
        </div>
      </div>
    </div>
  );
}
