import { Header } from "../components/ui";
import { when } from "../fmt";
import { tgUser, wa } from "../tg";
import { boot, data, picks } from "../store";

export function Profile() {
  const b = boot.value!, d = data.value!;
  const u = tgUser();
  const name = [u?.first_name ?? b.user.first_name, u?.last_name].filter(Boolean).join(" ") || "Участник семьи";
  const h = b.household;
  const held = d.rules.chains.filter((c) => h.cards[c.code]);
  return (
    <>
      <Header title="Профиль" />
      <section class="card prof">
        {u?.photo_url ? <img class="avatar" src={u.photo_url} alt="" /> : <span class="avatar">{name.slice(0, 1)}</span>}
        <div><h2>{name}</h2><small class="muted">{b.role === "admin" ? "Администратор семьи" : "Участник семьи"}</small><span class="pill">SSA · закрытое тестирование</span></div>
      </section>
      <div class="stats">
        <div class="card"><b>{picks.value.length}</b><small>товаров в списке</small></div>
        <div class="card"><b>{h.cashback_pct ? `${h.cashback_pct}%` : "—"}</b><small>кэшбэк банка</small></div>
      </div>
      <h3 class="sec">Мой профиль покупок</h3>
      <section class="card menu">
        <div class="mrow"><span>📍 Район</span><b>{h.area ?? "не выбран"}</b></div>
        <div class="mrow"><span>💳 Карты магазинов</span><b>{held.length ? held.map((c) => c.name).join(", ") : "нет"}</b></div>
        <div class="mrow"><span>🏦 Кэшбэк</span><b>{h.bank_cards.length ? h.bank_cards.map((c) => `${c.name} ${c.percent}%`).join(", ") : "не указан"}</b></div>
        <div class="mrow"><span>🕒 Цены на</span><b>{when(b.synced_at)}</b></div>
      </section>
      <p class="note">Район, карты и кэшбэк пока меняются в боте: команда /profile. Список товаров общий для бота и приложения.</p>
      <button class="btn-ghost wide" onClick={() => wa?.close()}>Вернуться в чат</button>
      <p class="note">Цены предварительные и могут отличаться в приложениях магазинов.</p>
    </>
  );
}
