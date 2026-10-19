import { createServerFn } from "@tanstack/react-start";
import { loadBreadth, loadDayBasket, loadDayBrief, loadDesk, loadFeed } from "./market.server";
import type { ArchiveSource } from "./market.types";

const SOURCES: ArchiveSource[] = ["all", "review", "intel", "report"];

export const getDesk = createServerFn({ method: "GET" }).handler(async () => loadDesk());

export const getDayBrief = createServerFn({ method: "GET" })
  .validator((input: { day?: string } | undefined) => {
    const day = typeof input?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : "";
    return { day };
  })
  .handler(async ({ data }) => loadDayBrief(data.day));

export const getDayBasket = createServerFn({ method: "GET" })
  .validator((input: { day?: string } | undefined) => {
    const day = typeof input?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : "";
    return { day };
  })
  .handler(async ({ data }) => loadDayBasket(data.day));

export const getBreadth = createServerFn({ method: "GET" }).handler(async () => loadBreadth());

export const getArchive = createServerFn({ method: "GET" })
  .validator((input: { q?: string; source?: string; limit?: number } | undefined) => {
    const raw = input ?? {};
    const q = typeof raw.q === "string" ? raw.q.slice(0, 80) : "";
    const source = SOURCES.includes(raw.source as ArchiveSource) ? (raw.source as ArchiveSource) : "all";
    const limit =
      typeof raw.limit === "number" && Number.isFinite(raw.limit)
        ? Math.min(2000, Math.max(12, Math.floor(raw.limit)))
        : 24;
    return { q, source, limit };
  })
  .handler(async ({ data }) =>
    loadFeed({
      q: data.q,
      source: data.source,
      limit: data.limit,
      includeReports: data.source === "report" || data.source === "all",
    }),
  );
