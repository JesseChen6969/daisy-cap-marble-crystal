import { useEffect, useState } from "react";
import { TerminalView } from "@/components/terminal-view";
import { getDesk } from "@/lib/market.functions";
import type { DeskTab } from "@/lib/desk-tab";
import type { Bar, Desk, Quote } from "@/lib/market.types";
import { cn } from "@/lib/cn";
import { dirClass, fmt, fmtDay, fmtPct, fmtSigned, fmtYi } from "@/lib/format";
import { readMarket } from "@/lib/reading";
import { INDICATORS, ZONE_ORDER, toneClass, toneLabel, toneOf, type ZoneKey } from "@/lib/zones";
import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";

const STEALTH_KEY = "eyu-stealth";

export function DeskView({ initial, tab, day }: { initial: Desk; tab: DeskTab; day?: string }) {
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [stealth, setStealth] = useState(false);

  useEffect(() => {
    setStealth(window.localStorage.getItem(STEALTH_KEY) === "1");
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const next = await getDesk();
        if (alive) {
          setData((prev) => keepTape(prev, next));
          setPulse((value) => value + 1);
          setError(null);
        }
      } catch {
        if (alive) setError("刷新没有成功，仍显示上一笔");
      }
    };
    const id = window.setInterval(tick, 20000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  async function refresh() {
    setPending(true);
    try {
      const next = await getDesk();
      setData((prev) => keepTape(prev, next));
      setPulse((value) => value + 1);
      setError(null);
    } catch {
      setError("刷新没有成功，仍显示上一笔");
    } finally {
      setPending(false);
    }
  }

  function toggleStealth() {
    setStealth((value) => {
      const next = !value;
      window.localStorage.setItem(STEALTH_KEY, next ? "1" : "0");
      return next;
    });
  }

  const values: Record<ZoneKey, number | null> = {
    bs: data.indicators.bs,
    uc: data.indicators.uc,
    hk: data.indicators.hk,
    av: data.indicators.av,
    cn10: data.indicators.cn10,
  };

  if (stealth) {
    return (
      <div className="min-h-screen bg-[#121214] px-3 py-4 text-[#f3efe6]">
        <div className="mb-3 flex justify-end">
          <button type="button" onClick={toggleStealth} className="h-10 rounded-full border border-[#3a3a42] px-3 text-sm">
            完整看板
          </button>
        </div>
        <p className="mb-3 text-sm leading-relaxed">{readMarket(data).headline}</p>
        <StealthStrip data={data} values={values} />
        {error ? <p className="mt-3 text-sm text-[#e0c39a]">{error}</p> : null}
      </div>
    );
  }

  return (
    <TerminalView
      data={data}
      pending={pending}
      error={error ?? (data.warnings.length ? data.warnings.join("；") : null)}
      tab={tab}
      day={day}
      pulse={pulse}
      onRefresh={() => void refresh()}
      onStealth={toggleStealth}
    />
  );
}

function keepTape(prev: Desk, next: Desk): Desk {
  if (next.tape.length > 0 || prev.tape.length === 0) return next;
  return {
    ...next,
    tape: prev.tape,
    series: next.series.length > 0 ? next.series : prev.series,
    shSeries: next.shSeries.length > 0 ? next.shSeries : prev.shSeries,
    notes: next.notes.length > 0 ? next.notes : prev.notes,
    margin: next.margin.length > 0 ? next.margin : prev.margin,
  };
}

function StealthStrip({ data, values }: { data: Desk; values: Record<ZoneKey, number | null> }) {
  return (
    <section className="mx-auto w-full max-w-xs rounded-3xl border border-line bg-panel p-4">
      <p className="num text-center text-sm text-muted">
        {data.hs300.date.slice(5) || "—"}
        <br />
        {data.hs300.time.slice(0, 5) || "—"}
      </p>
      <p className={cn("num mt-1 text-center text-xs", dirClass(data.hs300.pct))}>
        {fmt(data.hs300.price)} {fmtPct(data.hs300.pct)}
      </p>
      <div className="my-3 h-px bg-line" />
      <ul className="space-y-2">
        {ZONE_ORDER.map((key) => {
          const spec = INDICATORS[key];
          const tone = toneOf(key, values[key]);
          const text =
            key === "hk" || key === "cn10" ? fmtPct(values[key], spec.digits) : fmt(values[key], spec.digits);
          return (
            <li key={key} className={cn("num text-center text-sm", toneClass(tone))} title={spec.hint}>
              {spec.abbr}:{text}
            </li>
          );
        })}
      </ul>
      <div className="my-3 h-px bg-line" />
      <ul className="space-y-2 text-center text-sm text-paper">
        <li className="num">tup:{data.breadth.tup}</li>
        <li className="num">tdn:{data.breadth.tdn}</li>
        <li className="num">t5u:{data.breadth.t5u}</li>
        <li className="num">t5d:{data.breadth.t5d}</li>
      </ul>
    </section>
  );
}

function IndicatorCard({ id, value }: { id: ZoneKey; value: number | null }) {
  const spec = INDICATORS[id];
  const tone = toneOf(id, value);
  const shown = id === "hk" || id === "cn10" ? fmtPct(value, spec.digits) : fmt(value, spec.digits);
  return (
    <article className="rounded-2xl border border-line bg-panel p-3" title={spec.hint}>
      <p className="text-xs text-faint">
        {spec.abbr} · {spec.name}
      </p>
      <p className={cn("num mt-2 text-xl", toneClass(tone))}>{shown}</p>
      <p className="mt-1 text-xs text-muted">
        {toneLabel(tone)}
        {spec.unit ? ` · ${spec.unit}` : ""}
      </p>
    </article>
  );
}

function Tape({ quote, digits = 2, extra }: { quote: Quote; digits?: number; extra?: string }) {
  return (
    <article className="rounded-2xl border border-line bg-panel p-3">
      <p className="truncate text-xs text-faint">{quote.name}</p>
      <p className={cn("num mt-2 text-lg", dirClass(quote.pct))}>{fmt(quote.price, digits)}</p>
      <p className={cn("num text-xs", dirClass(quote.pct))}>{fmtPct(quote.pct)}</p>
      {extra ? <p className="num mt-1 text-xs text-faint">{extra}</p> : null}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="num text-paper">{value}</dd>
    </div>
  );
}

function Count({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div>
      <p className="text-xs text-faint">{label}</p>
      <p className={cn("num text-2xl", className)}>{value}</p>
    </div>
  );
}

function BreadthBar({ breadth }: { breadth: Desk["breadth"] }) {
  const parts = [
    { n: breadth.t5d, className: "bg-down" },
    { n: breadth.d50, className: "bg-down/45" },
    { n: breadth.u05, className: "bg-up/45" },
    { n: breadth.t5u, className: "bg-up" },
  ];
  const total = parts.reduce((sum, part) => sum + part.n, 0) || 1;
  return (
    <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-panel-2">
      {parts.map((part, index) => (
        <span key={index} className={part.className} style={{ width: `${(part.n / total) * 100}%` }} />
      ))}
    </div>
  );
}

function spanPct(series: Bar[]): number | null {
  if (series.length < 2) return null;
  const first = series[0]?.close;
  const last = series[series.length - 1]?.close;
  if (first == null || last == null || first === 0) return null;
  return ((last - first) / first) * 100;
}

function Chart({ series }: { series: Bar[] }) {
  if (series.length < 2) {
    return <p className="flex h-56 items-center text-sm text-muted">走势暂时没有取到。</p>;
  }
  const up = (spanPct(series) ?? 0) >= 0;
  const color = up ? "var(--color-up)" : "var(--color-down)";
  const first = series[0]?.date ?? "";
  const last = series[series.length - 1]?.date ?? "";
  return (
    <div className="mt-3">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip
              cursor={{ stroke: "var(--color-line)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as Bar;
                return (
                  <div className="rounded-lg border border-line bg-panel px-3 py-2">
                    <p className="text-xs text-faint">{row.date}</p>
                    <p className="num text-sm text-paper">{fmt(row.close)}</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="close" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span className="num">{first}</span>
        <span className="num">{last}</span>
      </div>
    </div>
  );
}

function MoverList({ title, rows }: { title: string; rows: Desk["leaders"] }) {
  return (
    <section className="rounded-3xl border border-line bg-panel p-4">
      <h2 className="text-base font-medium">{title}</h2>
      <ul className="mt-2">
        {rows.length === 0 ? (
          <li className="py-3 text-sm text-muted">成分行情还没到。</li>
        ) : (
          rows.map((row) => (
            <li key={row.code} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
              <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
              <span className="num text-xs text-faint">{row.code}</span>
              <span className={cn("num w-16 text-right text-sm", dirClass(row.pct))}>{fmtPct(row.pct)}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
