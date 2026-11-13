# SSA Mini App

Telegram Mini App «SSA — умные покупки»: каталог, корзина с ценами, «Где выгоднее купить». Только внешний вид (Preact + Vite + TypeScript).

В репозитории нет ключей, данных пользователей и адресов. Приложение ходит в один публичный адрес API (`src/api.ts`); доступ определяется подписью Telegram `initData`, проверяемой на сервере.

- `src/lib/compare.ts` — расчёт корзины и сравнения магазинов (порт серверного алгоритма).
- `npm run dev` / `npm run build`; публикация на GitHub Pages — `./deploy.sh` (ветка gh-pages; вариант через Actions — `ci/pages.yml.example`).
- `e2e/shots.mjs` — скриншоты с подменой Telegram и API (playwright-core).
