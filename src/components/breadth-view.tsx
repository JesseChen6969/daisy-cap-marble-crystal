import { useEffect, useMemo, useState } from "react";
import { getBreadth } from "@/lib/market.functions";
import type { BreadthPayload, ComponentRow } from "@/lib/market.types";
import { cn } from "@/lib/cn";
import { dirClass, fmt, fmtClockShort, fmtPct } from "@/lib/format";

type Filter = "all" | "up" | "down" | "t5u" | "t5d";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "up", label: "上涨" },
  { id: "down", label: "下跌" },
  { id: "t5u", label: "涨超5%" },
  { id: "t5d", label: "跌超5%" },
];

export function BreadthView({ initial }: { initial: BreadthPayload }) {
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const id = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        setData(await getBreadth());
      } catch {
        /* keep the last list */
      }
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  async function refresh() {
    setPending(true);
    try {
      setData(await getBreadth());
    } finally {
      setPending(false);
    }
  }

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.rows
      .filter((row) => {
        if (filter === "up" && !(row.pct != null && row.pct > 0)) return false;
        if (filter === "down" && !(row.pct != null && row.pct < 0)) return false;
        if (filter === "t5u" && !(row.pct != null && row.pct >= 5)) return false;
        if (filter === "t5d" && !(row.pct != null && row.pct <= -5)) return false;
        if (!query) return true;
        return row.name.toLowerCase().includes(query) || row.code.includes(query);
      })
      .sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999));
  }, [data.rows, filter, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-serif text-xs tracking-widest text-faint">HS300 BREADTH</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">涨跌结构</h1>
          <p className="mt-1 text-sm text-muted">
            上涨 {data.breadth.tup} · 下跌 {data.breadth.tdn} · 平 {data.breadth.flat}
            <span className="text-faint"> · {fmtClockShort(data.asOf)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={pending}
          className="h-11 rounded-lg border border-line bg-panel-2 px-3 text-sm disabled:opacity-60"
        >
          {pending ? "更新中" : "刷新"}
        </button>
      </div>

      {data.warning ? (
        <p className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-warn">{data.warning}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="tup 上涨" value={data.breadth.tup} className="text-up" />
        <Stat label="tdn 下跌" value={data.breadth.tdn} className="text-down" />
        <Stat label="t5u 涨超5%" value={data.breadth.t5u} className="text-up" />
        <Stat label="t5d 跌超5%" value={data.breadth.t5d} className="text-down" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="搜名称或代码"
          className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm text-paper placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={cn(
                "h-11 rounded-full border px-3 text-sm",
                filter === item.id ? "border-seal text-paper" : "border-line text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-faint">
        显示 {rows.length} / {data.rows.length}
      </p>

      <ul className="rounded-3xl border border-line bg-panel px-4">
        {rows.length === 0 ? (
          <li className="py-8 text-sm text-muted">没有符合的成分。</li>
        ) : (
          rows.map((row) => <Row key={row.code} row={row} />)
        )}
      </ul>
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <p className="text-xs text-faint">{label}</p>
      <p className={cn("num mt-1 text-2xl", className)}>{value}</p>
    </div>
  );
}

function Row({ row }: { row: ComponentRow }) {
  return (
    <li className="flex items-center gap-3 border-b border-line py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-paper">{row.name}</p>
        <p className="num text-xs text-faint">{row.code}</p>
      </div>
      <p className="num text-sm text-paper">{fmt(row.price)}</p>
      <p className={cn("num w-20 text-right text-sm", dirClass(row.pct))}>{fmtPct(row.pct)}</p>
    </li>
  );
}
