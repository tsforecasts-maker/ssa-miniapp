import { useEffect } from "preact/hooks";
import { Sheet } from "./components/Sheet";
import { Empty, TabBar } from "./components/ui";
import { Cart } from "./screens/Cart";
import { Catalog } from "./screens/Catalog";
import { Home } from "./screens/Home";
import { Profile } from "./screens/Profile";
import { Where } from "./screens/Where";
import { wa } from "./tg";
import { go, picks, sheet, status, toast, view } from "./store";

export function App() {
  const v = view.value, s = status.value;
  const deep = (v.tab === "catalog" && v.cat !== undefined) || !!v.where;
  useEffect(() => {
    const back = () => { if (sheet.value !== null) sheet.value = null; else if (v.where) go({ tab: "cart" }); else go({ tab: "catalog" }); };
    if (deep) { wa?.BackButton?.show(); wa?.BackButton?.onClick(back); } else wa?.BackButton?.hide();
    return () => wa?.BackButton?.offClick(back);
  }, [deep, v.where, v.cat]);

  if (s === "loading") return <div class="splash"><span class="logo big">SSA</span><p>Загружаю цены…</p></div>;
  if (s === "forbidden") return <Empty icon="🔒" title="Доступ закрыт" text="Вас пока нет в списке закрытого тестирования. Напишите Сергею — он откроет доступ." />;
  if (s === "offline") return <Empty icon="📡" title="Нет связи" text="Не получилось загрузить данные. Проверьте интернет и откройте приложение ещё раз." />;
  if (s === "no_telegram") return <Empty icon="✈️" title="Откройте из Telegram" text="Приложение работает внутри Telegram: нажмите кнопку «Открыть» в боте SSA." />;
  return (
    <>
      <main>
        {v.tab === "home" && <Home />}
        {v.tab === "catalog" && <Catalog />}
        {v.tab === "cart" && (v.where ? <Where /> : <Cart />)}
        {v.tab === "profile" && <Profile />}
      </main>
      <Sheet />
      {toast.value && <div class="toast">{toast.value}</div>}
      <TabBar count={picks.value.length} />
    </>
  );
}
