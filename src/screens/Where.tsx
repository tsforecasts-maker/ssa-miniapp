import { ChainBadge, Header } from "../components/ui";
import { money, when } from "../fmt";
import { DISCLAIMER, goodsWord, openChains, PEREKRESTOK_NOTE, type Basket } from "../lib/compare";
import { data, go, result, type PackView } from "../store";

const openPack = (pack: PackView) => go({ tab: "cart", where: true, pack });

function Fee({ b }: { b: Basket }) {
  if (b.fee === 0 && b.verified) return <>доставка бесплатно</>;
  if (b.fee === 0) return <>доставка ориентировочно 0 ₽</>;
  return <>доставка {money(b.fee)}{b.note ? ` (${b.note})` : ""}</>;
}

export function Where() {
  const d = data.value!, r = result.value!;
  const back = () => go({ tab: "cart" });
  const best = r.bestSingle;
  if (!best) return (<><Header title="Где выгоднее купить" back={back} /><p class="note">Нет подходящих цен в магазинах района.</p></>);
  const split = r.bestSplit;
  const splitOk = !!split && split.n === best.n;
  const splitBetter = splitOk && split!.total < best.total;
  const others = r.singles.filter((s) => s.chain !== best.chain);
  const top2 = [best, ...others.slice(0, 1)];
  const rest = r.singles.filter((s) => !top2.includes(s));
  const diff = splitOk ? best.total - split!.total : 0;
  const second = others.find((s) => s.n === best.n);
  const rec = splitBetter ? split!.baskets.map((b) => b.name).join(" + ") : best.name;
  const saving = splitBetter ? diff : second ? second.total - best.total : 0;
  const chains = openChains(r).map((c) => d.rules.chains.find((x) => x.code === c)!).filter(Boolean);
  return (
    <>
      <Header title="Где выгоднее купить" sub="Сравнили ваш список в магазинах района" back={back} />
      <div class="steps"><span class="done">1 Список</span><i /><span class="on">2 Сравнение</span><i /><span>3 Выбор</span></div>

      <div class="duo">
        {top2.map((s, i) => (
          <section key={s.chain} class={`card chain-card ${i === 0 ? "best" : ""}`}
            role="button" onClick={() => openPack({ mode: "single", chain: s.chain })}>
            <div class="cc-top"><ChainBadge code={s.chain} name={s.name} /><b>{s.name}</b><small>{s.n} {goodsWord(s.n)}</small></div>
            <small>Общая стоимость</small>
            <h2>{money(s.total)}</h2>
            <small class="muted"><Fee b={s} /></small>
            {s.missing.length > 0 && <small class="warn">нет: {s.missing.length}</small>}
            {i === 0 && <span class="tag">Выгоднее всего</span>}
          </section>
        ))}
      </div>

      <section class="card vs">
        <div class={`opt ${!splitBetter ? "sel" : ""}`}><b>Всё в одном магазине</b><small>Удобнее, быстрее, меньше доставок</small></div>
        <span class="vsm">vs</span>
        <div class={`opt ${splitBetter ? "sel" : ""}`}><b>Разделить</b><small>{split ? split.baskets.map((b) => b.name).join(" + ") : "нет вариантов"}</small></div>
      </section>

      {split && (
        <section class="card">
          <h3>Разделить заказ</h3>
          {split.baskets.map((b) => (
            <div class="srow" key={b.chain}><ChainBadge code={b.chain} name={b.name} size={26} />
              <div class="grow"><b>{b.name}</b><small>{b.n} {goodsWord(b.n)} · товары {money(b.goods)} · <Fee b={b} /></small></div></div>
          ))}
          <div class="srow total"><b>Итого</b><b>{money(split.total)}</b></div>
          {split.missing.length > 0 && <small class="warn">Не хватает: {split.missing.slice(0, 4).join(", ")}{split.missing.length > 4 ? ` и ещё ${split.missing.length - 4}` : ""}</small>}
        </section>
      )}

      <section class="card saving">
        <span class="piggy">🐷</span>
        <div>
          {saving > 0.5 ? (<><small>Итого вы экономите</small><h2>{money(saving)}</h2><small>выбирая {rec}</small></>)
            : splitOk && diff < 0 ? <><small>В одном магазине выгоднее на</small><h2>{money(-diff)}</h2><small>две доставки дороже</small></>
            : <><small>Рекомендуем</small><h2>{rec}</h2><small>{split && !splitOk ? `в одном магазине максимум ${best.n} ${goodsWord(best.n)}, при разделении — ${split.n}` : "самый дешёвый вариант по вашему списку"}</small></>}
        </div>
      </section>

      {rest.length > 0 && (
        <section class="card">
          <h3>Другие магазины</h3>
          {rest.map((s) => (
            <div class="srow" key={s.chain} role="button" onClick={() => openPack({ mode: "single", chain: s.chain })}>
              <ChainBadge code={s.chain} name={s.name} size={26} />
              <div class="grow"><b>{s.name}</b><small>{s.n} {goodsWord(s.n)}{s.missing.length ? `, не хватает ${s.missing.length}` : ""} · <Fee b={s} /></small></div>
              <b>{money(s.total)}</b></div>
          ))}
        </section>
      )}

      {split && split.baskets.length >= 2 && (
        <button class="btn-mix wide" type="button"
          onClick={() => openPack({ mode: "mix" })}>
          Оптимальный микс (купить в {split.baskets.length} магазинах)
        </button>
      )}
      {chains.map((c) => (
        <button key={c.code} class="btn-primary wide open" type="button"
          onClick={() => openPack({ mode: "single", chain: c.code })}>
          Открыть в {c.in}
        </button>
      ))}
      {r.cashbackPct > 0 && <p class="note">Кэшбэк {r.cashbackPct}% учтён в итоге (только на товары, не на доставку).</p>}
      {r.singles.some((s) => s.chain === "perekrestok") && <p class="note">Перекрёсток: {PEREKRESTOK_NOTE}.</p>}
      <p class="note shield">🛡 {DISCLAIMER}{r.asOf ? ` Цены на ${when(r.asOf)}.` : ""}</p>
    </>
  );
}
