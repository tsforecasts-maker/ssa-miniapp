export { money, goodsWord } from "./lib/compare";
const MSK: Intl.DateTimeFormatOptions = { timeZone: "Europe/Moscow", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
export function when(iso: string | null): string {
  if (!iso) return "—";
  const p = new Intl.DateTimeFormat("ru-RU", MSK).formatToParts(new Date(iso));
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("day")}.${g("month")}, ${g("hour")}:${g("minute")} МСК`;
}
