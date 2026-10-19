import type { ReactNode } from "react";
import type { Desk, TapePoint } from "@/lib/market.types";
import { cn } from "@/lib/cn";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";
import { readMarket, type Board } from "@/lib/reading";
import {
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LINES = [
  { key: "sh", name: "上证", color: "var(--color-up)" },
  { key: "hs300", name: "沪深300", color: "var(--color-amber)" },
  { key: "cyb", name: "创业板", color: "var(--color-down)" },
  { key: "small", name: "中证1000", color: "var(--color-steel)" },
  { key: "kc", name: "科创50", color: "var(--color-paper)" },
] as const;

export function BoardView({ data }: { data: Desk }) {
  const reading = readMarket(data);
  const board = reading.board;
  const quoteDay = data.sh.date || data.hs300.date || "—";
  const lastNet = data.margin.length ? data.margin[data.margin.length - 1] : null;
  const lastTape = data.tape.length ? data.tape[data.tape.length - 1] : null;
  const weak = data.laggards.slice(0, 2);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <section className="rounded-2xl border border-line bg-panel p-3">
            <p className="text-xs text-faint">消息面 · {quoteDay}</p>
            <ul className="mt-2 space-y-2">
              {data.author ? (
                <li>
                  <a href={data.author.link} target="_blank" rel="noreferrer" className="block">
                    <p className="text-xs text-seal">最近复盘</p>
                    <p className="text-sm leading-snug text-paper">{data.author.title}</p>
                    {data.author.verdict ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted">{data.author.verdict}</p>
                    ) : null}
                  </a>
                </li>
              ) : null}
              {data.feed.slice(0, 3).map((item) => (
                <li key={item.link}>
                  <a href={item.link} target="_blank" rel="noreferrer" className="block text-sm leading-snug text-muted hover:text-paper">
                    <span className="mr-1 text-xs text-faint">{item.tag}</span>
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-panel p-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium">综合得分率</h2>
              <p className="text-xs text-faint">七项均值</p>
            </div>
            <p className="num mt-2 text-5xl tracking-tight text-paper">{board.rate.toFixed(1)}%</p>
            <p className="mt-1 text-xs text-muted">
              <span className="rounded-full border border-line px-2 py-0.5 text-paper">{board.band}</span>
              <span className="ml-2">40 观望线 · 60 做多线</span>
            </p>
            <div className="relative mt-3 h-1.5 rounded-full bg-ink">
              <span className="absolute inset-y-0 left-0 rounded-full bg-seal" style={{ width: `${Math.max(2, Math.min(100, board.rate))}%` }} />
              <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-faint" style={{ left: "40%" }} />
              <span className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-paper" style={{ left: "60%" }} />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-faint">
              做多线以上才算右侧。磨底可以试多，试多不是把这张图看满。
            </p>
          </section>

          <ForcePanel board={board} />
          <p className="px-1 text-xs leading-relaxed text-faint">
            势力 {fmt(board.forceSum, 0)} / {board.forceMax} · 格局 {board.pattern} ·{" "}
            {data.emotion ? `跌停 ${data.emotion.limitDown}${data.emotion.limitDown <= 15 ? "，急跌不恐慌" : ""}` : "跌停未取到"}
          </p>
        </aside>

        <div className="min-w-0 space-y-3">
          <section className="rounded-2xl border border-line bg-panel p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium">关键指数 · 日涨跌</h2>
              <p className="text-xs text-faint">近一个月交易日</p>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
              <Chip name="上证" pct={data.sh.pct} color="text-up" />
              <Chip name="沪深300" pct={data.hs300.pct} color="text-amber" />
              <Chip name="创业板" pct={data.cyb.pct} color="text-down" />
              <Chip name="中证1000" pct={findPct(data, "1000")} color="text-steel" />
              <Chip name="科创50" pct={lastTape?.kc ?? null} color="text-paper" />
              <Chip name="恒生科技" pct={data.hstech.pct} color="text-muted" />
            </ul>
            <TapeChart tape={data.tape} />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <Brief title="信号面">
              <LineItem k="短期冷热" v={board.heat} />
              <LineItem k="主线结构" v={reading.spokes.find((item) => item.label === "盘面结构")?.note ?? "—"} />
              <LineItem k="护盘力度" v={`${board.patternNote} · ${board.pattern}`} />
              <LineItem k="盘中" v={board.quiet} />
              <LineItem
                k="弱的一边"
                v={
                  weak.length
                    ? weak.map((row) => `${row.name} ${fmtPct(row.pct)}`).join(" · ")
                    : "成分领跌没有取到"
                }
              />
              <LineItem k="气氛组" v={data.brokers?.pct != null ? `证券 ${fmtPct(data.brokers.pct)}` : "—"} />
            </Brief>
            <Brief title="资金面">
              <LineItem k="赚钱效应" v={reading.spokes.find((item) => item.label === "赚钱效应")?.note ?? "—"} />
              <LineItem k="五方势力" v={`${board.pattern} ${((board.forceSum / Math.max(1, board.forceMax)) * 100).toFixed(1)} 分`} />
              <LineItem k="融资" v={lastNet ? `净买入 ${fmtSigned(lastNet.netYi, 0)} 亿 · 连撤 ${reading.marginStreak} 天` : "没有取到"} />
              <LineItem k="国家队" v={board.forces.find((arm) => arm.label === "国家队")?.note ?? "—"} />
              <LineItem k="港股" v={data.hstech.pct != null ? `恒生科技 ${fmtPct(data.hstech.pct)}` : "—"} />
              <LineItem k="贴水" v={data.indicators.bs != null ? `基差 ${fmtSigned(data.indicators.bs, 0)} 点，不当右侧` : "—"} />
            </Brief>
            <Brief title="情绪面">
              <LineItem k="涨停跌停" v={data.emotion ? `${data.emotion.limitUp} / ${data.emotion.limitDown}` : "没有取到"} />
              <LineItem k="上涨下跌" v={data.emotion ? `${data.emotion.up} / ${data.emotion.down}` : "—"} />
              <LineItem k="沪深300" v={`上涨 ${data.breadth.tup} · 下跌 ${data.breadth.tdn}`} />
              <LineItem k="周线" v={reading.spokes.find((item) => item.label === "周线")?.note ?? "—"} />
              <LineItem k="量能" v={reading.spokes.find((item) => item.label === "量能")?.note ?? "—"} />
            </Brief>
            <Brief title="仓位姿态">
              <p className="text-xs text-faint">这是复盘里的做法，不是账户仓位。</p>
              <Pose label="长线" width={board.band === "做多" ? 60 : board.band === "回避" ? 10 : 30} text="底仓，不空也不满" />
              <Pose label="短线" width={board.band === "做多" ? 40 : 0} text={board.band === "做多" ? "可以做，仍要快" : "右侧未齐，先不做"} />
              <p className="text-xs leading-relaxed text-muted">{reading.position}</p>
            </Brief>
          </section>
        </div>
      </div>
    </div>
  );
}

function ForcePanel({ board }: { board: Board }) {
  const plot = board.forces.map((arm) => ({ ...arm, fill: (arm.score / arm.max) * 100 }));
  return (
    <section className="rounded-2xl border border-line bg-panel p-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium">资金势力</h2>
        <p className="num text-xs text-amber">{((board.forceSum / Math.max(1, board.forceMax)) * 100).toFixed(1)}%</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={plot} cx="50%" cy="50%" outerRadius="62%">
            <PolarGrid stroke="var(--color-line)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar dataKey="fill" stroke="var(--color-amber)" fill="var(--color-amber)" fillOpacity={0.28} strokeWidth={1.5} isAnimationActive={false} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1">
        {board.forces.map((arm) => (
          <li key={arm.label} className="flex items-baseline justify-between gap-2 text-xs">
            <span className="text-muted">{arm.label}</span>
            <span className="num text-amber">
              {arm.score.toFixed(0)}/{arm.max}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-faint">
        外圈是该项满分。机构看大小票，国家队看权重和跌停，外资看恒生科技，散户看涨跌家数，游资看涨停和创业板。公开行情的代理，不是内部席位。
      </p>
    </section>
  );
}

function TapeChart({ tape }: { tape: TapePoint[] }) {
  if (tape.length < 2) {
    return <p className="flex h-64 items-center text-sm text-muted">日线没有取到。</p>;
  }
  return (
    <div className="mt-2 h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={tape} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "var(--color-faint)", fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
          <YAxis
            tick={{ fill: "var(--color-faint)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={(value: number) => `${value.toFixed(0)}`}
          />
          <ReferenceLine y={0} stroke="var(--color-line)" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0]?.payload as TapePoint;
              return (
                <div className="rounded-lg border border-line bg-panel px-3 py-2">
                  <p className="text-xs text-faint">{row.date}</p>
                  {LINES.map((line) => (
                    <p key={line.key} className="num text-xs text-paper">
                      {line.name} {fmtPct(row[line.key])}
                    </p>
                  ))}
                </div>
              );
            }}
          />
          {LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={1.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Chip({ name, pct, color }: { name: string; pct: number | null; color: string }) {
  return (
    <li className={color}>
      {name} {pct == null ? "" : fmtPct(pct)}
    </li>
  );
}

function findPct(data: Desk, needle: string): number | null {
  return data.ladder.find((item) => item.name.includes(needle))?.pct ?? null;
}

function Brief({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="rounded-2xl border border-line bg-panel p-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </article>
  );
}

function LineItem({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex items-baseline justify-between gap-3 text-sm">
      <span className="shrink-0 text-xs text-faint">{k}</span>
      <span className="text-right text-paper">{v}</span>
    </p>
  );
}

function Pose({ label, width, text }: { label: string; width: number; text: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="text-faint">{text}</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-ink">
        <span className={cn("block h-full rounded-full", width > 0 ? "bg-seal" : "bg-transparent")} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
