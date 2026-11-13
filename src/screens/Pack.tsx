import { useState } from "preact/hooks";
import { Header, Thumb } from "../components/ui";
import { money } from "../fmt";
import { goodsWord, type Basket } from "../lib/compare";
import { inChain, productUrl } from "../lib/product_url";
import { loadChecked, resetChecked, saveChecked } from "../lib/pack";
import { openLink } from "../tg";
import { data, go, result } from "../store";

export type PackView = { mode: "single"; chain: string } | { mode: "mix" };

function shop(chain: string, url: string | null | undefined, name: string) {
  const u = productUrl(chain, url, name);
  if (u.startsWith("https://")) openLink(u);
}

function Row({ chain, id, name, img, cat, qty, price, url, on, toggle }: {
  chain: string; id: number; name: string; img: string | null; cat: number;
  qty: number; price: number; url: string | null; on: boolean; toggle: () => void;
}) {
  return (
    <div class={`pack-row ${on ? "on" : ""}`}>
      <button class="chk" type="button" aria-pressed={on} aria-label={on ? "добавлен" : "не добавлен"}
        onClick={(e) => { e.stopPropagation(); toggle(); }}>{on ? "✓" : ""}</button>
      <button class="pack-main" type="button" onClick={() => shop(chain, url, name)}>
        <Thumb cat={cat} src={img} size={44} alt={name} />
        <div class="grow">
          <b class="rname">{name}</b>
          <small class="muted">{qty} шт. · {money(price)}</small>
        </div>
      </button>
      <button class="btn-shop" type="button" onClick={() => shop(chain, url, name)}>В магазин ↗</button>
    </div>
  );
}

export function Pack({ pack }: { pack: PackView }) {
  const d = data.value!, r = result.value!;
  const hh = d.household.id;
  const back = () => go({ tab: "cart", where: true });
  const blocks: Basket[] = pack.mode === "mix"
    ? (r.bestSplit?.baskets ?? [])
    : r.singles.filter((s) => s.chain === pack.chain);
  const chains = blocks.map((b) => b.chain);
  const [tick, setTick] = useState(0);
  const checked = new Map(chains.map((c) => [c, loadChecked(hh, c)]));
  void tick;
  const toggle = (chain: string, id: number) => {
    const set = new Set(checked.get(chain) ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    saveChecked(hh, chain, set);
    setTick((n) => n + 1);
  };
  const reset = () => { resetChecked(hh, chains); setTick((n) => n + 1); };
  const rows = blocks.flatMap((b) => b.items.map((x) => ({ b, x })));
  const m = rows.length;
  const n = rows.filter(({ b, x }) => checked.get(b.chain)?.has(x.item.id)).length;
  const total = blocks.reduce((s, b) => s + b.goods, 0);
  const chainName = (code: string) => d.rules.chains.find((c) => c.code === code)?.in ?? code;
  const title = pack.mode === "mix"
    ? "Оптимальный микс"
    : `Сборка заказа ${inChain(chainName(pack.chain))}`;
  const sub = pack.mode === "mix"
    ? `купить в ${blocks.length} магазинах · ${n} из ${m} добавлено`
    : `${n} из ${m} добавлено`;
  return (
    <>
      <Header title={title} sub={sub} back={back} />
      {blocks.map((b) => (
        <section class="card list" key={b.chain}>
          {pack.mode === "mix" && (
            <h3 class="pack-block">Купить {inChain(chainName(b.chain))} ({b.n} {goodsWord(b.n)} — {money(b.goods)})</h3>
          )}
          {b.items.map(({ item, offer }) => (
            <Row key={`${b.chain}-${item.id}`} chain={b.chain} id={item.id} name={item.name}
              img={item.img} cat={item.cat} qty={offer.qty} price={offer.line} url={offer.url}
              on={!!checked.get(b.chain)?.has(item.id)} toggle={() => toggle(b.chain, item.id)} />
          ))}
        </section>
      ))}
      {m === 0 && <p class="note">В этой сети нет позиций из вашей корзины с ценой в наличии.</p>}
      <div class="pack-foot">
        <div class="srow total"><b>Итого</b><b>{money(pack.mode === "mix" ? (r.bestSplit?.total ?? total) : (blocks[0]?.total ?? total))}</b></div>
        <small class="muted">{n} из {m} добавлено</small>
        <button class="btn-ghost wide" type="button" onClick={reset}>Сбросить отметки</button>
      </div>
    </>
  );
}
