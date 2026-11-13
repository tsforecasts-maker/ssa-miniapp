import { Header } from "../components/ui";
import { CategoryList } from "./Catalog";
import { money, when, goodsWord } from "../fmt";
import { freshness } from "../lib/compare";
import { boot, data, go, refreshing, result } from "../store";

export function Home() {
  const b = boot.value!, d = data.value!, r = result.value!;
  const ref = r.bestSingle;
  const lastAt = r.asOf ?? b.synced_at;
  const stale = d.rules.chains.filter((c) => {
    const times = d.offers.filter((o) => o.c === c.code && o.at).map((o) => o.at!).sort();
    return times.length && freshness(d.rules, c.code, times[times.length - 1]) !== "fresh";
  }).map((c) => c.name);
  return (
    <>
      <Header title="Умные покупки" sub="Smart Shopping Assistant" />
      <section class="card fresh">
        <span class={`fresh-ico ${stale.length ? "warn" : ""}`}>{refreshing.value ? "⟳" : "✓"}</span>
        <div>
          <b>Цены обновлены</b>
          <small>{when(lastAt)}{stale.length ? ` · у ${stale.join(", ")} данные могут быть старше` : ""}</small>
        </div>
      </section>

      <section class="card hero">
        <small>Ваша корзина</small>
        {r.items.length && ref ? (
          <>
            <div class="hero-row"><h2>{r.items.length} {goodsWord(r.items.length)}</h2><b class="big-price">{money(ref.total)}</b></div>
            <small>Выгоднее всего: {ref.name}{ref.missing.length ? ` · не хватает ${ref.missing.length}` : ""}</small>
            <button class="btn-primary wide" onClick={() => go({ tab: "cart", where: true })}>Оптимизировать корзину ›</button>
          </>
        ) : (
          <>
            <h2>Пока пусто</h2>
            <small>Отметьте, что вы обычно покупаете, и я сравню цены в магазинах района.</small>
            <button class="btn-primary wide" onClick={() => go({ tab: "catalog" })}>Выбрать товары</button>
          </>
        )}
      </section>

      <h3 class="sec">Каталог</h3>
      <CategoryList />
    </>
  );
}
