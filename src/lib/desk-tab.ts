export type DeskTab = "overview" | "risk" | "mood" | "detail";

export function parseDeskTab(value: unknown): DeskTab {
  if (value === "risk" || value === "mood" || value === "detail") return value;
  return "overview";
}

export function parseDeskDay(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  return value;
}
