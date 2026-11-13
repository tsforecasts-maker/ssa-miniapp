// Checked "added to the store cart" flags, persisted per household + chain + Moscow date.

function todayMSK(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Moscow" });
}

export function packKey(householdId: number, chain: string, date = todayMSK()): string {
  return `ssa:pack:${householdId}:${chain}:${date}`;
}

export function loadChecked(householdId: number, chain: string): Set<number> {
  try {
    const raw = localStorage.getItem(packKey(householdId, chain));
    const ids: number[] = raw ? JSON.parse(raw) : [];
    return new Set(ids.filter((n) => Number.isInteger(n)));
  } catch { return new Set(); }
}

export function saveChecked(householdId: number, chain: string, ids: Set<number>): void {
  try { localStorage.setItem(packKey(householdId, chain), JSON.stringify([...ids])); } catch { /* quota */ }
}

export function resetChecked(householdId: number, chains: string[]): void {
  for (const c of chains) {
    try { localStorage.removeItem(packKey(householdId, c)); } catch { /* ignore */ }
  }
}
