import { Header } from "../components/ui";
import { money, when } from "../fmt";
import { dateRangeRu, dateFullRu } from "../lib/habits";
import { tgUser, wa } from "../tg";
import { boot, data, go, view } from "../store";

export function Profile() {
  const sub = view.value.profileSub;
  if (sub === "notify") return <NotifyPage />;
  if (sub === "history") return <HistoryPage />;
  if (sub === "shops") return <ShopsPage />;
  if (sub === "about") return <AboutPage />;
  return <ProfileHome />;
}

function ProfileHome() {
  const b = boot.value!;
  const u = tgUser();
  const name = [u?.first_name ?? b.user.first_name, u?.last_name].filter(Boolean).join(" ") || "Участник семьи";
  const h = b.household;
  const habits = b.habits;
  const period = habits ? dateRangeRu(habits.period_from, habits.period_to) : "";
  return (
    <>
      <Header title="Профиль" />
      <section class="card prof">
        {u?.photo_url ? <img class="avatar" src={u.photo_url} alt="" /> : <span class="avatar">{name.slice(0, 1)}</span>}
        <div>
          <h2>{name}</h2>
          <small class="muted">{h.name || "Семья"} · {b.role === "admin" ? "Администратор семьи" : "Участник семьи"}</small>
        </div>
      </section>
      <div class="stats">
        <div class="card"><b>{habits?.n_receipts ?? 0}</b><small>чеков{period ? ` · ${period}` : ""}</small></div>
        <div class="card"><b>{habits?.n_purchases ?? 0}</b><small>покупок за период</small></div>
      </div>
      <section class="card">
        <small>Оценочная экономия</small>
        <b>{habits?.savings != null ? (habits.savings.pct != null ? `${habits.savings.pct}%` : money(habits.savings.amount ?? 0)) : "пока мало данных"}</b>
      </section>
      <section class="card menu">
        <button class="mrow" onClick={() => go({ tab: "profile", profileSub: "notify" })}><span>🔔 Уведомления</span><b>›</b></button>
        <button class="mrow" onClick={() => go({ tab: "profile", profileSub: "history" })}><span>🧾 История покупок</span><b>›</b></button>
        <button class="mrow" onClick={() => go({ tab: "profile", profileSub: "shops" })}><span>🏪 Магазины и карты</span><b>›</b></button>
        <button class="mrow" onClick={() => go({ tab: "profile", profileSub: "about" })}><span>ℹ️ О приложении</span><b>›</b></button>
      </section>
      <button class="btn-ghost wide" onClick={() => wa?.close()}>Вернуться в чат</button>
    </>
  );
}

function NotifyPage() {
  return (
    <>
      <Header title="Уведомления" back={() => go({ tab: "profile" })} />
      <section class="card"><p>Скоро. Настроим напоминания, когда появятся регулярные закупки.</p></section>
    </>
  );
}

function HistoryPage() {
  const list = boot.value?.habits?.receipts ?? [];
  return (
    <>
      <Header title="История покупок" back={() => go({ tab: "profile" })} />
      {!list.length ? (
        <p class="note">Пока нет сохранённых чеков.</p>
      ) : list.slice().reverse().map((r) => (
        <section class="card hist" key={`${r.date}-${r.chain}-${r.total}`}>
          <div>
            <b>{r.chain_name}</b>
            <small class="muted">{dateFullRu(r.date)}</small>
          </div>
          <b>{money(r.total)}</b>
        </section>
      ))}
    </>
  );
}

function ShopsPage() {
  const b = boot.value!, d = data.value!;
  const h = b.household;
  const held = d.rules.chains.filter((c) => h.cards[c.code]);
  return (
    <>
      <Header title="Магазины и карты" back={() => go({ tab: "profile" })} />
      <section class="card menu">
        <div class="mrow"><span>📍 Район</span><b>{h.area ?? "не выбран"}</b></div>
        <div class="mrow"><span>💳 Карты магазинов</span><b>{held.length ? held.map((c) => c.name).join(", ") : "нет"}</b></div>
        <div class="mrow"><span>🏦 Кэшбэк</span><b>{h.bank_cards.length ? h.bank_cards.map((c) => `${c.name} ${c.percent}%`).join(", ") : "не указан"}</b></div>
        <div class="mrow"><span>🕒 Цены на</span><b>{when(b.synced_at)}</b></div>
      </section>
      <p class="note">Район, карты и кэшбэк меняются в боте: команда /profile. Здесь только просмотр.</p>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <Header title="О приложении" back={() => go({ tab: "profile" })} />
      <section class="card">
        <p><b>SSA</b> — умные покупки для всей семьи. Закрытое семейное тестирование.</p>
        <p class="note">Цены предварительные и могут отличаться в приложениях магазинов. Фото товаров приводятся с указанием источника, где оно есть.</p>
      </section>
    </>
  );
}
