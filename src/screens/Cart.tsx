import { Empty, Header, Qty, Thumb } from "../components/ui";
import { money, when } from "../fmt";
import { freshnessLabel, goodsWord, PEREKRESTOK_NOTE } from "../lib/compare";
import { data, go, result } from "../store";

export function Cart() {
  const d = data.value!, r = result.value!;
  if (!r.areaOk) return (<><Header title="Моя корзина" /><Empty icon="📍" title="Выберите район" text="В боте откройте «Профиль» и выберите район — от него зависят магазины и цены." /></>);
  if (!r.items.length) {
    return (<><Header title="Моя корзина" /><Empty icon="🧺" title="Пока пусто" text="Отметьте, что вы обычно покупаете, в каталоге.">
      <button class="btn-primary" onClick={() => go({ tab: "catalog" })}>Открыть каталог</button></Empty></>);
  }
  const ref = r.bestSingle;
  const offerOf = (id: number) => ref?.items.find((x) => x.item.id === id)?.offer;
  const saving = ref ? Math.max(0, ref.regularGoods - ref.goods) : 0;
  return (
    <>
      <Header title="Моя корзина" sub={`${r.items.length} ${goodsWord(r.items.length)}${r.asOf ? ` · цены на ${when(r.asOf)}` : ""}`} />
      {ref ? (
        <section class="card total-card">
          <small>Лучший вариант — всё в одном магазине</small>
          <div class="total-row">
            <div><h2>{ref.name}</h2><b class="big-price">{money(ref.total)}</b></div>
            {saving >= 1 && <span class="pill">−{money(saving)} от обычной</span>}
          </div>
          <small class="muted">товары {money(ref.goods)} + доставка {money(ref.fee)}{ref.cashback ? ` − кэшбэк ${money(ref.cashback)}` : ""}{ref.missing.length ? ` · не хватает: ${ref.missing.length}` : ""}</small>
        </section>
      ) : <section class="card"><b>По выбранным товарам пока нет цен в вашем районе.</b></section>}
      <section class="card list">
        {r.items.map((it) => {
          const o = offerOf(it.id);
          return (
            <div class="row" key={it.id}>
              <Thumb cat={it.cat} src={it.img} size={46} alt={it.name} />
              <div class="grow">
                <b class="rname">{it.name}</b>
                <small class="muted">{[it.size, it.brand ?? it.catalogBrand].filter(Boolean).join(" · ")}</small>
                {o && ref ? <small class={`st ${o.basis}`}>{[o.substitute ? "замена" : "", o.basis === "card" ? "по карте" : o.basis === "promo" ? "акция" : o.basis === "card_assumed" ? "цена по карте" : "", freshnessLabel(d.rules, ref.chain, o.at)].filter(Boolean).join(" · ")}</small>
                  : <small class="st none">{ref ? `нет в ${d.rules.chains.find((c) => c.code === ref.chain)?.in ?? ref.name}` : "нет цены в вашем районе"}</small>}
                {it.suggestions && Object.values(it.suggestions)[0] && <small class="st">замена: {Object.values(it.suggestions)[0].brand || "аналог"} за {money(Object.values(it.suggestions)[0].line)}</small>}
              </div>
              <div class="right">
                <Qty id={it.id} />
                {o && <div class="line"><b>{money(o.line)}</b>{o.regularLine > o.line + 0.005 && <s>{money(o.regularLine)}</s>}</div>}
              </div>
            </div>
          );
        })}
      </section>
      {ref && ref.chain === "perekrestok" && <p class="note">Перекрёсток: {PEREKRESTOK_NOTE}.</p>}
      <p class="note">Цены предварительные.</p>
      <div class="cta-bar">
        <button class="btn-primary wide" disabled={!ref} onClick={() => go({ tab: "cart", where: true })}>Оптимизировать корзину ›</button>
      </div>
    </>
  );
}
