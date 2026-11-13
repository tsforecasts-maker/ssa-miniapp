import { markWelcomeSeen } from "../lib/habits";

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div class="welcome">
      <span class="logo big">SSA</span>
      <h1>Умные покупки для всей семьи</h1>
      <p>Сравним цены в магазинах района и соберём выгодную корзину.</p>
      <button class="btn-primary wide" onClick={() => { markWelcomeSeen(); onStart(); }}>Начать</button>
    </div>
  );
}
