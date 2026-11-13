import { useEffect, useState } from "preact/hooks";
import { Header, Thumb } from "../components/ui";
import { money } from "../fmt";
import { goodsWord, type Basket } from "../lib/compare";
import { inChain, productUrl } from "../lib/product_url";
import { loadChecked, nextUnchecked, resetChecked, saveChecked, type PackItemRef } from "../lib/pack";
import { onAppVisible, openLink } from "../tg";
import { data, go, result } from "../store";

export type PackView = { mode: "single"; chain: string } | { mode: "mix" };

function rowId(chain: string, id: number): string {
  return `pack-${chain}-${id}`;
}

function shop(chain: string, url: string | null | undefined, name: string) {
  const u = productUrl(chain, url, name);
  if (u.startsWith("https://")) openLink(u);
}

function Row({ chain, id, name, img, cat, qty, price, url, on, isNext, pulse, toggle, open }: {
  chain: string; id: number; name: string; img: string | null; cat: number;
  qty: number; price: number; url: string | null; on: boolean; isNext: boolean; pulse: boolean;
  toggle: () => void; open: () => void;
}) {
  return (
    <div id={rowId(chain, id)} class={`pack-row ${on ? "on" : ""} ${isNext ? "next" : ""} ${pulse && isNext ? "pulse" : ""}`}>
      <button class="chk" type="button" aria-pressed={on} aria-label={on ? "добавлен" : "не добавлен"}
        onClick={(e) => { e.stopPropagation(); toggle(); }}>{on ? "✓" : ""}</button>
      <button class="pack-main" type="button" onClick={open}>
        <Thumb cat={cat} src={img} size={44} alt={name} />
        <div class="grow">
          <b class="rname">{name}</b>
          <small class="muted">{qty} шт. · {money(price)}</small>
        </div>
      </button>
      <button class="btn-shop" type="button" onClick={open}>В магазин ↗</button>
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
  const [last, setLast] = useState<PackItemRef | null>(null);
  const [pulse, setPulse] = useState(false);
  const checked = new Map(chains.map((c) => [c, loadChecked(hh, c)]));
  void tick;
  const setOn = (chain: string, id: number, on: boolean) => {
    const set = new Set(checked.get(chain) ?? []);
    if (on) set.add(id); else set.delete(id);
    saveChecked(hh, chain, set);
    setTick((n) => n + 1);
  };
  const toggle = (chain: string, id: number) => setOn(chain, id, !checked.get(chain)?.has(id));
  const reset = () => { resetChecked(hh, chains); setLast(null); setTick((n) => n + 1); };
  const rows = blocks.flatMap((b) => b.items.map((x) => ({ b, x })));
  const refs: PackItemRef[] = rows.map(({ b, x }) => ({ chain: b.chain, id: x.item.id }));
  const lookup = new Map(rows.map(({ b, x }) => [`${b.chain}:${x.item.id}`, { b, x }]));
  const m = rows.length;
  const n = rows.filter(({ b, x }) => checked.get(b.chain)?.has(x.item.id)).length;
  const nxt = nextUnchecked(refs, checked, last);
  const nxtRow = nxt ? lookup.get(`${nxt.chain}:${nxt.id}`) : undefined;
  const openItem = (chain: string, id: number, url: string | null, name: string) => {
    setOn(chain, id, true);
    setLast({ chain, id });
    shop(chain, url, name);
  };
  const total = blocks.reduce((s, b) => s + b.goods, 0);
  const chainName = (code: string) => d.rules.chains.find((c) => c.code === code)?.in ?? code;
  const title = pack.mode === "mix"
    ? "Оптимальный микс"
    : `Сборка заказа ${inChain(chainName(pack.chain))}`;
  const sub = pack.mode === "mix"
    ? `купить в ${blocks.length} магазинах · ${n} из ${m} добавлено`
    : `${n} из ${m} добавлено`;

  useEffect(() => {
    return onAppVisible(() => {
      const cur = nextUnchecked(refs, checked, last);
      if (!cur) return;
      document.getElementById(rowId(cur.chain, cur.id))?.scrollIntoView({ behavior: "smooth", block: "center" });
      setPulse(true);
      window.setTimeout(() => setPulse(false), 1400);
    });
  });

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
              on={!!checked.get(b.chain)?.has(item.id)}
              isNext={!!nxt && nxt.chain === b.chain && nxt.id === item.id}
              pulse={pulse}
              toggle={() => toggle(b.chain, item.id)}
              open={() => openItem(b.chain, item.id, offer.url, item.name)} />
          ))}
        </section>
      ))}
      {m === 0 && <p class="note">В этой сети нет позиций из вашей корзины с ценой в наличии.</p>}
      <div class="pack-foot">
        <div class="srow total"><b>Итого</b><b>{money(pack.mode === "mix" ? (r.bestSplit?.total ?? total) : (blocks[0]?.total ?? total))}</b></div>
        <small class="muted">{n} из {m} добавлено</small>
        <button class="btn-ghost wide" type="button" onClick={reset}>Сбросить отметки</button>
      </div>
      {m > 0 && (
        nxt && nxtRow ? (
          <div class="pack-cta">
            <button class="btn-primary wide pack-next-btn" type="button"
              onClick={() => openItem(nxt.chain, nxt.id, nxtRow.x.offer.url, nxtRow.x.item.name)}>
              <span class="pack-cta-label">Следующий: {nxtRow.x.item.name}</span>
              <span class="pack-cta-go">В магазин ↗</span>
            </button>
          </div>
        ) : (
          <div class="pack-cta done" role="status">Все товары добавлены</div>
        )
      )}
    </>
  );
}
