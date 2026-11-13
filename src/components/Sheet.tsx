import { money } from "../fmt";
import { asRule, buildItems, freshnessLabel } from "../lib/compare";
import { Qty, ChainBadge, Thumb } from "./ui";
import { data, pickMap, setPick, sheet } from "../store";

const RULES: [1 | 2 | 3, string][] = [
  [1, "Не менять бренд ни при каких условиях"],
  [2, "Предлагать замену, но только с моим согласием"],
  [3, "Можно выбирать аналог ради экономии"],
];

/** Product card: photo, prices per chain, brand, assistant rule, quantity. */
export function Sheet() {
  const id = sheet.value, d = data.value;
  if (id === null || !d) return null;
  const item = d.items.find((i) => i.id === id);
  if (!item) return null;
  const pick = pickMap.value.get(id);
  const rule = asRule(pick?.rule);
  const [it] = buildItems(d, [{ catalog_id: id, qty: pick?.qty ?? 1, brand: pick?.brand ?? null, rule }]);
  const rows = d.rules.chains.filter((c) => it.offers[c.code]).map((c) => ({ c, o: it.offers[c.code] }))
    .sort((a, b) => a.o.line - b.o.line);
  const cheapest = rows[0]?.o.line;
  const brand = pick?.brand ?? null;
  const close = () => { sheet.value = null; };
  const sugg = Object.entries(it.suggestions ?? {});
  return (
    <div class="sheet-bg" onClick={close}>
      <div class="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={item.name}>
        <span class="grab" />
        <div class="sheet-top">
          <Thumb cat={item.cat} src={item.img} size={72} alt={item.name} />
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
        {rows.length === 0 && sugg.length === 0 && <p class="muted">Пока нет подходящего предложения в магазинах района.</p>}
        {rows.map(({ c, o }) => (
          <div class="chain-row" key={c.code}>
            <ChainBadge code={c.code} name={c.name} size={30} />
            <div class="grow">
              <b>{c.name}</b>
              <small>{[o.substitute ? "замена" : "", o.basis === "card" ? "по карте" : o.basis === "card_assumed" ? "цена по карте" : o.basis === "promo" ? "акция" : "",
                freshnessLabel(d.rules, c.code, o.at)].filter(Boolean).join(" · ")}</small>
            </div>
            <div class="price">{money(o.line)}{o.qty !== 1 && <small> × {o.qty}</small>}{o.line === cheapest && rows.length > 1 && <i class="best">дешевле</i>}</div>
          </div>
        ))}
        {sugg.length > 0 && (
          <>
            <h3>Дешевле с заменой</h3>
            <p class="muted">Предложение, его можно принять, сменив марку.</p>
            {sugg.map(([ch, o]) => {
              const c = d.rules.chains.find((x) => x.code === ch);
              return (
                <div class="chain-row" key={ch}>
                  <ChainBadge code={ch} name={c?.name ?? ch} size={30} />
                  <div class="grow"><b>{c?.name ?? ch}</b><small>замена · {o.brand || o.title}</small></div>
                  <div class="price">{money(o.line)}<i class="best">замена</i></div>
                </div>
              );
            })}
          </>
        )}
        <h3>Правило для ассистента</h3>
        <p class="muted">Как ассистент должен поступать с этим товаром.</p>
        <div class="rules">
          {RULES.map(([n, label]) => (
            <button key={n} type="button" class={`rule ${rule === n ? "on" : ""}`}
              onClick={() => setPick(id, pick?.qty ?? 1, brand, n)}>
              <span class="radio" aria-hidden="true">{rule === n ? "●" : "○"}</span>
              <i>{n}</i>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p class="note shield rule-note">Выбор меняет правило поведения ассистента при сборке будущих корзин</p>
        {item.img && <p class="note">Фото: Open Food Facts, CC BY-SA</p>}
        <div class="sheet-foot">
          <Qty id={id} add="Добавить в список" />
          <button class="btn-primary" onClick={close}>Готово</button>
        </div>
      </div>
    </div>
  );
}
