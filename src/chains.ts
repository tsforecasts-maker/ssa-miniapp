export const CHAIN_COLOR: Record<string, string> = {
  lenta: "#0a4da2", magnit: "#e30613", vkusvill: "#4aa82a", dixy: "#f26f21", pyaterochka: "#d71920", perekrestok: "#1b8f3a",
};
export const CAT_ICON: Record<number, string> = {
  1: "🥛", 2: "🍗", 3: "🌾", 4: "🍎", 5: "🍞", 6: "🧃", 7: "🥫", 8: "🍼", 9: "🧻", 10: "🧽", 11: "🧴", 12: "🪥",
};
export const iconOf = (cat: number): string => CAT_ICON[cat] ?? "🛒";
