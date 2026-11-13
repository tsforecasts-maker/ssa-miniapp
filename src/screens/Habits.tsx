import { Header } from "../components/ui";
import { GROUP_META, GROUPS, countsOf, dateRu, todayMsk, totalOf, type GroupKey, type Habits } from "../lib/habits";
import { boot, go, setGroup, view } from "../store";

function habitsOf(): Habits | null {
  return boot.value?.habits ?? null;
}

export function HabitsHome() {
  const h = habitsOf();
  if (!h) {
    return (
      <>
        <Header title="Как я покупаю" back={() => go({ tab: "home" })} />
        <p class="note">Пока нет данных по чекам. Когда появятся покупки, здесь будут группы товаров.</p>
      </>
    );
  }
  const counts = countsOf(h);
  const total = totalOf(h) || 1;
  const fresh = todayMsk(h.updated_at);
  return (
    <>
      <Header title="Как я покупаю" back={() => go({ tab: "home" })} />
      <section class="card fresh">
        <span class="fresh-ico">✓</span>
        <div>
          <b>{fresh ? "Обновлено сегодня" : `Обновлено ${dateRu(h.updated_at)}`}</b>
          <small>{h.fill_note}</small>
        </div>
      </section>
      <section class="card fill-card">
        <small>Насколько хорошо мы вас знаем</small>
        <div class="fill-row"><b>Заполнено на {h.fill_pct}%</b></div>
        <div class="bar"><i style={{ width: `${h.fill_pct}%` }} /></div>
      </section>
      <div class="habit-grid">
        {GROUPS.map((g) => {
          const meta = GROUP_META[g];
          const n = counts[g];
          return (
            <button class={`habit-card ${meta.color}`} onClick={() => go({ tab: "home", habits: true, habitGroup: g })}>
              <small>{meta.title}</small>
              <b>{n}</b>
              <span>{meta.caption}</span>
              <div class="bar"><i style={{ width: `${Math.round((n / total) * 100)}%` }} /></div>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function HabitsList({ group }: { group: GroupKey }) {
  const h = habitsOf();
  const meta = GROUP_META[group];
  const items = h?.groups?.[group]?.items ?? [];
  return (
    <>
      <Header title={meta.title} sub={meta.caption} back={() => go({ tab: "home", habits: true })} />
      {!items.length ? (
        <p class="note">Пока пусто. Товары появятся по чекам и списку семьи, или перенесите сюда вручную.</p>
      ) : items.map((it) => (
        <section class="card habit-item" key={it.id}>
          {it.img ? <img class="thumb photo" src={it.img} alt="" /> : <span class="thumb">🛒</span>}
          <div class="habit-item-body">
            <b>{it.name}</b>
            <small class="muted">
              {it.receipts ? `в ${it.receipts} чек${it.receipts === 1 ? "е" : "ах"}` : "в чеках пока не встречался"}
              {it.source === "user" ? " · перенесён вручную" : ""}
            </small>
            <div class="move">
              {GROUPS.filter((g) => g !== group).map((g) => (
                <button class="chip" onClick={() => setGroup(it.id, g)}>{GROUP_META[g].title}</button>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
