import { Link, useNavigate } from "@tanstack/react-router";
import { RefreshCw, Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/cn";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";
import type { DayBasket, DayBoard, DayBrief, DayStats, Desk } from "@/lib/market.types";
import { readMarket, type Reading } from "@/lib/reading";
import { scoreDesk, type Arm, type ScoreDay } from "@/lib/scorecard";
import { carryWarnings, openDayFlight, preferCount, replayDesk, shownCount, takeDayFlight } from "@/lib/replay";
import type { DeskTab } from "@/lib/desk-tab";
import { marketPhase } from "@/lib/zones";
import { getDayBasket, getDayBrief } from "@/lib/market.functions";

type Frame = "day" | "intra";

const TABS: { id: DeskTab; label: string }[] = [
  { id: "overview", label: "概览" },
  { id: "risk", label: "风险与仓位" },
  { id: "mood", label: "情绪与轮动" },
  { id: "detail", label: "明细" },
];

const LINES = [
  { key: "sh", name: "上证", color: "#ef5b4a" },
  { key: "alla", name: "全A", color: "#6aa7ff" },
  { key: "hs300", name: "沪深300", color: "#b388ff" },
  { key: "small", name: "中证1000", color: "#e0a24a" },
  { key: "cyb", name: "创业板指", color: "#3dcec6" },
  { key: "kc", name: "科创50", color: "#7dce6a" },
] as const;

export function TerminalView({
  data,
  tab,
  day,
  pulse = 0,
  pending,
  error,
  onRefresh,
  onStealth,
}: {
  data: Desk;
  tab: DeskTab;
  day?: string;
  pulse?: number;
  pending: boolean;
  error: string | null;
  onRefresh: () => void;
  onStealth: () => void;
}) {
  const navigate = useNavigate();
  const [frame, setFrame] = useState<Frame>("day");
  const [dimsOpen, setDimsOpen] = useState(false);
  const [span, setSpan] = useState<{ from: string; to: string } | null>(null);
  const [picked, setPicked] = useState<string | undefined>(day);
  const [brief, setBrief] = useState<DayBrief | null>(null);
  const [basket, setBasket] = useState<DayBasket | null>(null);
  const [basketDay, setBasketDay] = useState<string | null>(null);
  const liveDate = (data.sh.date || data.hs300.date || "").slice(0, 10);
  useEffect(() => {
    setPicked(day);
  }, [day]);
  const days = useMemo(() => {
    const set = new Set<string>();
    for (const row of data.tape) {
      if (row.date >= "2025-01-01") set.add(row.date);
    }
    if (liveDate >= "2025-01-01") set.add(liveDate);
    if (picked) set.add(picked);
    return [...set].sort();
  }, [data.tape, liveDate, picked]);
  const selected = picked || (days.includes(liveDate) ? liveDate : (days[days.length - 1] ?? ""));
  const view = useMemo(
    () => replayDesk(data, selected && selected !== liveDate ? selected : null),
    [data, selected, liveDate],
  );
  const historical = view.historical;
  const briefFlight = useRef<{ day: string; token: number } | null>(null);
  const basketFlight = useRef<{ day: string; token: number } | null>(null);
  const flightSeq = useRef(0);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    if (!selected) return;
    const day = selected;
    setBrief((prev) => (prev?.day === day ? prev : null));
    const opened = openDayFlight(briefFlight.current, day, flightSeq.current + 1);
    briefFlight.current = opened.flight;
    if (opened.token == null) return;
    flightSeq.current = opened.token;
    const token = opened.token;
    getDayBrief({ data: { day } })
      .then((note) => {
        const taken = takeDayFlight(briefFlight.current, token, day, selectedRef.current);
        briefFlight.current = taken.flight;
        if (!taken.accept) return;
        setBrief(note);
      })
      .catch(() => {
        const taken = takeDayFlight(briefFlight.current, token, day, selectedRef.current);
        briefFlight.current = taken.flight;
        if (!taken.accept) return;
        setBrief((prev) =>
          prev?.day === day ? prev : { day, author: null, items: [], amountWanYi: null, stats: null, market: null },
        );
      });
  }, [selected, pulse]);
  useEffect(() => {
    if (!historical || !selected) return;
    const day = selected;
    setBasket((prev) => (prev?.day === day ? prev : null));
    setBasketDay((prev) => (prev === day ? prev : null));
    if (basket?.day === day) return;
    const opened = openDayFlight(basketFlight.current, day, flightSeq.current + 1);
    basketFlight.current = opened.flight;
    if (opened.token == null) return;
    flightSeq.current = opened.token;
    const token = opened.token;
    getDayBasket({ data: { day } })
      .then((row) => {
        const taken = takeDayFlight(basketFlight.current, token, day, selectedRef.current);
        basketFlight.current = taken.flight;
        if (!taken.accept) return;
        setBasket(row);
        setBasketDay(day);
      })
      .catch(() => {
        const taken = takeDayFlight(basketFlight.current, token, day, selectedRef.current);
        basketFlight.current = taken.flight;
        if (!taken.accept) return;
        setBasketDay(day);
      });
  }, [historical, selected, pulse, basket]);
  const basketReady = basketDay === selected;
  const shown = useMemo(() => {
    if (!historical || !brief || brief.day !== selected) return view.desk;
    return applyBrief(view.desk, brief, basketReady ? basket : null);
  }, [view.desk, historical, brief, selected, basket, basketReady]);
  const briefMatch = brief?.day === selected;
  const stats = historical && briefMatch ? (brief?.stats ?? null) : null;
  const liveStats = !historical && briefMatch ? (brief?.stats ?? null) : null;
  const statsPending = historical && !briefMatch;
  const briefReady = historical && briefMatch;
  const card = useMemo(() => scoreDesk(shown), [shown]);
  const reading = useMemo(() => readMarket(shown), [shown]);
  const phase = marketPhase();
  const closed = phase.phase === "closed" || phase.phase === "weekend" || phase.phase === "lunch";
  const quoteTime = historical ? "收盘" : (data.sh.time || data.hs300.time || "").slice(0, 5) || "—";
  const longPct = card.longPct;
  const shortPct = card.shortPct;
  const positioned = longPct != null && shortPct != null;
  const cash = positioned ? 100 - longPct - shortPct : null;

  function chooseDay(next: string) {
    const value = !next || next === liveDate ? undefined : next;
    if (value === picked) return;
    setPicked(value);
    setSpan(null);
    void navigate({ to: "/", search: { tab, day: value }, replace: true });
  }

  function openTab(next: DeskTab) {
    if (next === tab) return;
    void navigate({ to: "/", search: { tab: next, day } });
  }

  return (
    <div className="min-h-screen bg-[#121214] text-[#f3efe6]">
      <header className="bg-gradient-to-b from-[#e23d32] to-[#c4251c]">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 md:px-4">
          <span className="grid size-7 place-items-center rounded-md bg-white/15 text-sm">鳄</span>
          <h1 className="text-base font-medium tracking-tight">鳄鱼派量化系统</h1>
          <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[11px]">V9.3</span>
          <nav className="relative z-30 flex flex-wrap items-center gap-1 md:ml-2" aria-label="看板分页">
            {TABS.map((item) => (
              <Link
                key={item.id}
                to="/"
                search={{ tab: item.id, day }}
                aria-current={tab === item.id ? "page" : undefined}
                onPointerDown={(event) => {
                  if (event.button !== 0) return;
                  openTab(item.id);
                }}
                className={cn(
                  "inline-flex min-h-10 items-center rounded-full px-3.5 text-sm",
                  tab === item.id ? "bg-white text-[#c4251c]" : "text-white/85 hover:bg-white/10",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="ml-auto hidden text-xs text-white/85 lg:block">
            点位 · 仓位 · 风险管理 三位一体 | 守株待兔 · 买预期卖事实
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 bg-[#a51c16] px-3 py-1.5 text-xs md:px-4">
          <Mod to="/" label="交易" day={day} />
          <Mod to="/archive" label="研究" />
          <Mod to="/method" label="系统" />
          <Mod to="/breadth" label="体系" />
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <TradeDay days={days} value={selected} onChange={chooseDay} />
            <button
              type="button"
              onClick={() => chooseDay(liveDate)}
              className={cn(
                "h-7 rounded-full px-2",
                historical ? "bg-black/25 text-white" : "bg-white text-[#c4251c]",
              )}
            >
              今天
            </button>
            <span className="inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1">
              <span className={cn("size-1.5 rounded-full", error ? "bg-[#e0a24a]" : "bg-[#7dce6a]")} />
              {error ? "部分缺失" : "已连接"}
            </span>
            <span className="rounded-full bg-black/25 px-2 py-1">{historical ? "收盘回放" : `数据 ${quoteTime}`}</span>
            <span className="rounded-full bg-black/25 px-2 py-1">
              {historical ? (shown.emotion ? "六维: 当天重算" : "六维: 数据不足") : "六维: 现算"} · 曲线: 路径分
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 disabled:opacity-60"
            >
              <RefreshCw className={cn("size-3", pending && "animate-spin")} />
              刷新
            </button>
            <span className={cn("rounded-full px-2 py-1", historical || closed ? "bg-white text-[#c4251c]" : "bg-black/25")}>
              {historical ? "历史收盘" : closed ? "休市缓存" : phase.label}
            </span>
            <button type="button" onClick={onStealth} aria-label="摸鱼条" className="rounded-full bg-black/25 p-1.5">
              <Settings className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-3 py-3 md:px-4">
        {error ? (
          <p className="rounded-lg border border-[#5a4030] bg-[#2a2118] px-3 py-2 text-sm text-[#e0c39a]">{error}</p>
        ) : null}
        {historical ? (
          <p className="rounded-lg border border-[#4a3b28] bg-[#2a2418] px-3 py-2 text-xs leading-relaxed text-[#e6d3a1]">
            {shown.warnings[0]}
            {shown.tape[shown.tape.length - 1]?.vol != null
              ? ` 上证成交量 ${shown.tape[shown.tape.length - 1]?.vol?.toFixed(2)} 亿手。`
              : ""}
          </p>
        ) : null}
        <EventBar data={shown} />
        {historical ? (
          <ReviewCard data={shown} pending={!briefReady} amount={briefReady ? (brief?.amountWanYi ?? null) : null} />
        ) : null}
        {tab === "overview" ? (
          <Overview
            data={shown}
            card={card}
            cash={cash}
            frame={frame}
            setFrame={setFrame}
            dimsOpen={dimsOpen}
            setDimsOpen={setDimsOpen}
            span={span}
            setSpan={setSpan}
            historical={historical}
            reading={reading}
            stats={stats}
            boards={stats ?? liveStats}
            statsPending={statsPending}
            statsReady={briefMatch}
            basketReady={basketReady}
          />
        ) : null}
        {tab === "risk" ? <Risk data={shown} card={card} cash={cash} reading={reading} historical={historical} /> : null}
        {tab === "mood" ? <Mood data={shown} card={card} stats={stats} boards={stats ?? liveStats} ready={briefMatch} /> : null}
        {tab === "detail" ? <Detail data={shown} card={card} reading={reading} /> : null}
      </div>
    </div>
  );
}

function Mod({ to, label, day }: { to: "/" | "/archive" | "/method" | "/breadth"; label: string; day?: string }) {
  const className = "rounded-full px-2 py-1 text-white/90 hover:bg-white/10";
  if (to === "/") {
    return (
      <Link to="/" search={{ tab: "overview", day }} className={className}>
        {label}
      </Link>
    );
  }
  return (
    <Link to={to} className={className}>
      {label}
    </Link>
  );
}

function EventBar({ data }: { data: Desk }) {
  const chips = data.feed.filter((item) => item.link !== data.author?.link).slice(0, 3);
  return (
    <section className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] px-3 py-2 text-xs">
      <span className="text-[#f3efe6]">消息面事件</span>
      <span className="text-[#8d877d]">数据 {data.sh.date || "—"}</span>
      {data.author ? (
        <a
          href={data.author.link}
          target="_blank"
          rel="noreferrer"
          className="max-w-full truncate rounded-full bg-[#2a2418] px-2 py-1 text-[#e6c36a]"
          title={data.author.verdict || data.author.title}
        >
          复盘 {data.author.verdict ? data.author.verdict.slice(0, 36) : data.author.title}
        </a>
      ) : null}
      {chips.map((item) => (
        <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="max-w-[16rem] truncate rounded-full bg-[#242428] px-2 py-1 text-[#d9d3c8]">
          {item.tag} {item.title}
        </a>
      ))}
      {chips.length === 0 && !data.author ? <span className="text-[#8d877d]">没有取到这一天的公开复盘</span> : null}
    </section>
  );
}

function ReviewCard({ data, pending, amount }: { data: Desk; pending: boolean; amount: number | null }) {
  const intel = data.feed.filter((item) => item.kind === "intel" && item.link !== data.author?.link);
  const body = data.author?.excerpt || data.author?.verdict || "";
  return (
    <section className="rounded-xl border border-[#4a3b28] bg-[#1c1a16] px-3 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm text-[#e6c36a]">这一天的公众号</h2>
        <span className="num text-[11px] text-[#8d877d]">{data.sh.date || "—"} 收盘</span>
      </div>
      {data.author ? (
        <a href={data.author.link} target="_blank" rel="noreferrer" className="mt-1 block text-sm text-[#f3efe6] hover:text-[#e6c36a]">
          {data.author.title}
        </a>
      ) : (
        <p className="mt-1 text-sm text-[#b7b0a6]">公开档案里没有对上这一天的复盘。</p>
      )}
      {body ? (
        <p className="mt-2 text-sm leading-relaxed text-[#d9d3c8]">{body}</p>
      ) : data.author ? (
        <p className="mt-2 text-xs text-[#8d877d]">{pending ? "正文正在取。" : "正文没有取到，可以点标题看原文。"}</p>
      ) : null}
      {amount != null ? <p className="num mt-2 text-xs text-[#e6c36a]">复盘原文写两市成交 {amount.toFixed(2)} 万亿。行情接口没有这一天的成交额。</p> : null}
      {intel.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {intel.map((item) => (
            <a key={item.link} href={item.link} target="_blank" rel="noreferrer" className="text-xs text-[#d9d3c8] underline decoration-[#4a3b28] underline-offset-2">
              {item.tag} · {item.title}
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Overview({
  data,
  card,
  cash,
  frame,
  setFrame,
  dimsOpen,
  setDimsOpen,
  span,
  setSpan,
  historical,
  reading,
  stats,
  boards,
  statsPending,
  statsReady,
  basketReady,
}: {
  data: Desk;
  card: ReturnType<typeof scoreDesk>;
  cash: number | null;
  frame: Frame;
  setFrame: (frame: Frame) => void;
  dimsOpen: boolean;
  setDimsOpen: (open: boolean) => void;
  span: { from: string; to: string } | null;
  setSpan: (span: { from: string; to: string } | null) => void;
  historical: boolean;
  reading: Reading;
  stats: DayStats | null;
  boards: DayStats | null;
  statsPending: boolean;
  statsReady: boolean;
  basketReady: boolean;
}) {
  const all = card.series;
  const oldest = all[0]?.date ?? "";
  const newest = all[all.length - 1]?.date ?? "";
  const presetFrom = all[Math.max(0, all.length - 23)]?.date ?? oldest;
  const from = span && span.from >= oldest && span.from <= newest ? span.from : presetFrom;
  const to = span && span.to >= from && span.to <= newest ? span.to : newest;
  const shown = all.filter((row) => row.date >= from && row.date <= to);
  const last = shown[shown.length - 1];
  const withYear = from.slice(0, 4) !== to.slice(0, 4);
  const sessionPoint = card.series[card.series.length - 1];
  const scored = (data.emotion?.up ?? 0) + (data.emotion?.down ?? 0) > 0;
  const faceRate = historical && !scored ? (sessionPoint?.rate ?? null) : card.rate;
  const faceBand = historical && !scored ? "不给仓位" : card.band;
  return (
    <>
      <div className="grid items-start gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          <section className="rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3">
            <div className="flex items-center justify-between text-xs text-[#b7b0a6]">
              <span>{historical && !scored ? "指数路径分" : "综合得分率"}</span>
              {historical && !scored ? null : (
                <button type="button" onClick={() => setDimsOpen(!dimsOpen)} className="text-[#8d877d]">
                  六维结构 {dimsOpen ? "收起" : "详情"}
                </button>
              )}
            </div>
            <p className="num mt-2 text-5xl leading-none text-white">{faceRate == null ? "—" : `${faceRate.toFixed(2)}%`}</p>
            {historical && !scored ? (
              <p className="num mt-2 text-xs text-[#8d877d]">指数路径分 · 40 观望 · 60 做多 · 涨跌家数还没到，先不重算六维</p>
            ) : (
              <p className="num mt-2 text-xs text-[#8d877d]">
                总分 {card.points.toFixed(2)} / 可用满分 {card.max.toFixed(2)}
              </p>
            )}
            <p className="mt-2 inline-flex rounded-full bg-[#2a241c] px-2 py-0.5 text-xs text-[#e6c36a]">{faceBand}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#2a2a30]">
              <div className="h-full bg-[#e23d32]" style={{ width: `${Math.max(0, Math.min(100, faceRate ?? 0))}%` }} />
            </div>
            <div className="num mt-1 flex justify-between text-[10px] text-[#6f6a62]">
              <span>0</span><span>30</span><span>40</span><span>60</span><span>80</span><span>100</span>
            </div>
            <p className="mt-1 text-[11px] text-[#6f6a62]">分区刻度 · 40 观望线 · 60 做多线</p>
            {historical && !scored ? (
              <p className="mt-3 border-t border-[#2c2c32] pt-2 text-[11px] leading-relaxed text-[#8d877d]">
                {statsPending ? "这一天的涨跌家数和沪深300成分正在取。" : "这一天的涨跌家数没有取到，六维先不重算。"}
              </p>
            ) : (
              <>
                {historical ? (
                  <p className="mt-3 border-t border-[#2c2c32] pt-2 text-[11px] leading-relaxed text-[#8d877d]">
                    按这一天的公开涨跌家数重算。分母仍是 107，不是内部权重。
                  </p>
                ) : null}
                {dimsOpen ? (
              <ul className="mt-3 space-y-1.5 border-t border-[#2c2c32] pt-2">
                {card.dims.map((dim) => (
                  <li key={dim.label} className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-[#d9d3c8]">{dim.label}</span>
                    <span className="num text-[#e6c36a]">
                      {dim.score.toFixed(2)}/{dim.max.toFixed(0)}
                    </span>
                  </li>
                ))}
                <li className="pt-1 text-[11px] leading-relaxed text-[#8d877d]">
                  刻度和截图一致。每一维用公开行情现算，不是未公开的内部权重。
                </li>
              </ul>
                ) : null}
              </>
            )}
          </section>

          <section className="rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3">
            {historical ? (
              <>
                <p className="text-xs text-[#b7b0a6]">这一天的指数</p>
                <ul className="mt-2 space-y-1.5">
                  {data.ladder.map((item) => (
                    <li key={item.code} className="flex justify-between text-xs">
                      <span className="text-[#d9d3c8]">{item.name}</span>
                      <span className={cn("num", (item.pct ?? 0) > 0 ? "text-[#ef5b4a]" : (item.pct ?? 0) < 0 ? "text-[#3dcec6]" : "text-[#d9d3c8]")}>
                        {fmtPct(item.pct)}
                      </span>
                    </li>
                  ))}
                  <li className="flex justify-between text-xs">
                    <span className="text-[#d9d3c8]">创业板</span>
                    <span className={cn("num", (data.cyb.pct ?? 0) > 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]")}>{fmtPct(data.cyb.pct)}</span>
                  </li>
                  <li className="flex justify-between text-xs">
                    <span className="text-[#d9d3c8]">证券</span>
                    <span className={cn("num", (data.brokers?.pct ?? 0) > 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]")}>{fmtPct(data.brokers?.pct)}</span>
                  </li>
                  <li className="flex justify-between text-xs">
                    <span className="text-[#d9d3c8]">恒生科技</span>
                    <span className={cn("num", (data.hstech.pct ?? 0) > 0 ? "text-[#ef5b4a]" : data.hstech.pct == null ? "text-[#8d877d]" : "text-[#3dcec6]")}>
                      {data.hstech.pct == null ? "没有这一天" : fmtPct(data.hstech.pct)}
                    </span>
                  </li>
                  <li className="flex justify-between text-xs">
                    <span className="text-[#d9d3c8]">十年国债</span>
                    <span className={cn("num", (data.bond.pct ?? 0) > 0 ? "text-[#ef5b4a]" : data.bond.pct == null ? "text-[#8d877d]" : "text-[#3dcec6]")}>
                      {data.bond.pct == null ? "没有这一天" : fmtPct(data.bond.pct)}
                    </span>
                  </li>
                </ul>
              </>
            ) : (
              <>
            <p className="text-xs text-[#b7b0a6]">资金势力</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={card.arms.map((arm) => ({ ...arm, pct: (arm.score / arm.max) * 100 }))} outerRadius="68%">
                  <PolarGrid stroke="#3a3a42" />
                  <PolarAngleAxis dataKey="label" tick={<ForceTick arms={card.arms} />} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="pct" stroke="#e6c36a" fill="#e6c36a" fillOpacity={0.35} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[11px] text-[#b7b0a6]">
              总分 <span className="num text-[#e6c36a]">{card.forceRate.toFixed(2)}</span>
              <span className="mx-1">·</span>
              格局 {card.pattern}
              <span className="mx-1">·</span>
              {card.patternNote}
            </p>
              </>
            )}
          </section>
        </div>

        <section className="min-w-0 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm">得分率走势 × 关键指数</h2>
            <div className="ml-auto flex items-center gap-1 text-xs">
              <button type="button" onClick={() => setFrame("intra")} className={cn("rounded-full px-2 py-1", frame === "intra" ? "bg-[#e23d32]" : "text-[#8d877d]")}>
                分时
              </button>
              <button type="button" onClick={() => setFrame("day")} className={cn("rounded-full px-2 py-1", frame === "day" ? "bg-[#e23d32]" : "text-[#8d877d]")}>
                日K
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
            <span className="text-[#b7b0a6]">时间段</span>
            {oldest && newest ? (
              <>
                <Ymd
                  value={from}
                  min={oldest}
                  max={newest}
                  onChange={(value) => setSpan(value <= to ? { from: value, to } : { from: to, to: value })}
                />
                <span className="text-[#8d877d]">至</span>
                <Ymd
                  value={to}
                  min={oldest}
                  max={newest}
                  onChange={(value) => setSpan(value >= from ? { from, to: value } : { from: value, to: from })}
                />
              </>
            ) : null}
            <span className="hidden h-4 w-px bg-[#3a3a42] sm:inline" />
            {(
              [
                ["23", "近23日", null],
                ["3m", "近3月", shiftIso(newest, -92)],
                ["1y", "近1年", shiftIso(newest, -365)],
                ["all", "全部", oldest],
              ] as const
            ).map(([id, label, start]) => {
              const active =
                id === "23"
                  ? span == null
                  : span != null && start != null && from === (start < oldest ? oldest : start) && to === newest;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() =>
                    setSpan(start == null ? null : { from: start < oldest ? oldest : start, to: newest })
                  }
                  className={cn(
                    "h-9 rounded-full border px-2.5",
                    active ? "border-[#e23d32] bg-[#e23d32] text-white" : "border-[#3a3a42] text-[#d9d3c8]",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-[#6f6a62]">
            日K · {from} 至 {to} · {shown.length} 个交易日
            {historical || to !== newest
              ? " · 整段都是指数路径分，买卖点只按这套算法"
              : " · 整段都是指数路径分，买卖点只按这套算法。上面的百分比是当天六维分，不回写到曲线"}
            {" · 全A为沪深300与中证1000等权"}
          </p>
          {frame === "intra" ? (
            <p className="flex h-64 items-center text-sm text-[#8d877d]">公开行情没有分时成交明细，切回日K看收盘读数。</p>
          ) : shown.length < 2 ? (
            <p className="flex h-64 items-center text-sm text-[#8d877d]">这段里没有足够的交易日。</p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                <Legend swatch="#c4a574" text={`得分率 ${last?.rate == null ? "—" : last.rate.toFixed(2)}%`} />
                <Legend swatch="#e6c36a" text={`资金势力 ${last?.force == null ? "—" : last.force.toFixed(2)}%`} />
                {LINES.map((line) => (
                  <Legend key={line.key} swatch={line.color} text={`${line.name} ${fmtPct(last?.[line.key] ?? null)}`} />
                ))}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={shown} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#2a2a30" vertical={false} />
                    <XAxis
                      dataKey="date"
                      minTickGap={28}
                      tickFormatter={(value: string) => (withYear ? String(value).slice(2) : String(value).slice(5))}
                      tick={{ fill: "#8d877d", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis yAxisId="pct" tick={{ fill: "#8d877d", fontSize: 10 }} axisLine={false} tickLine={false} width={36} unit="%" />
                    <YAxis yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fill: "#8d877d", fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                    <Tooltip content={<ChartTip />} />
                    <Line yAxisId="score" dataKey="rate" name="得分率" stroke="#c4a574" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="score" dataKey="force" name="资金势力" stroke="#e6c36a" strokeWidth={1.6} dot={false} isAnimationActive={false} />
                    {LINES.map((line) => (
                      <Line
                        key={line.key}
                        yAxisId="pct"
                        dataKey={line.key}
                        name={line.name}
                        stroke={line.color}
                        strokeWidth={1.2}
                        dot={line.key === "sh" && shown.length <= 40 ? MarkDot : false}
                        activeDot={line.key === "sh" ? false : { r: 3 }}
                        connectNulls
                        isAnimationActive={false}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="h-14">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={shown} margin={{ top: 4, right: 40, left: 36, bottom: 0 }}>
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={[0, "dataMax"]} />
                    <Bar dataKey="vol" isAnimationActive={false} shape={<VolBar />} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm text-[#b7b0a6]">盘面总述</h2>
        <p className="mb-2 text-sm leading-relaxed text-[#f3efe6]">{historical ? reading.detail : card.headline}</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card title="信号面">
            <Row
              k="短期过热判定"
              v={
                scored
                  ? `${card.heat} · 涨 ${data.emotion?.up ?? 0} / 跌 ${data.emotion?.down ?? 0}`
                  : historical
                    ? stats
                      ? heatLine(stats)
                      : statsPending
                        ? "正在取"
                        : "涨停池没有取到"
                    : card.heat
              }
              hot={scored ? card.heat === "短期冰点" || card.heat === "过热" : !historical && (card.heat === "短期冰点" || card.heat === "过热")}
            />
            <Row
              k="主线判断"
              v={
                historical
                  ? stats
                    ? mainLine(stats)
                    : statsPending
                      ? "题材正在取"
                      : "涨停题材没有取到"
                  : card.mainShare != null
                    ? `${card.mainName}${card.mainPct == null ? "" : ` ${fmtPct(card.mainPct)}`} · 占比 ${card.mainShare.toFixed(0)}%`
                    : card.mainName
              }
              gold={(!historical && card.mainShare != null) || (historical && Boolean(stats?.mainName))}
            />
            <Row
              k="护盘/过热"
              v={
                !historical || scored
                  ? `${card.zone} · 齐发 · GS ${card.gs.toFixed(2)}/10 · HS ${card.hs.toFixed(2)}/10`
                  : `${data.sh.price != null ? `上证 ${data.sh.price.toFixed(0)}` : "上证没有收盘"} · ${card.quiet}`
              }
            />
            <Row k="护盘盘中" v={card.quiet} />
            <Row k="缩量杀权重" v={data.laggards.length > 0 || !historical ? card.kill : stats ? killLine(data, card, stats) : card.kill} />
            {historical && data.leaders.length > 0 ? (
              <Row
                k="沪深300领涨"
                v={data.leaders
                  .slice(0, 2)
                  .map((row) => `${row.name} ${fmtPct(row.pct)}`)
                  .join(" · ")}
                hot
              />
            ) : null}
          </Card>
          <Card title="资金面">
            <Row
              k="赚钱效应"
              v={
                card.active != null
                  ? `${card.effectWord} +${(card.dims[0]?.score ?? 0).toFixed(1)}/15`
                  : historical && stats
                    ? `封住 ${stats.limitUp} · 炸板 ${stats.broken}`
                    : "涨跌家数没有取到"
              }
              gold={card.active != null}
            />
            <Row
              k="五方势力"
              v={
                scored || !historical
                  ? `${card.pattern} ${card.forceRate.toFixed(2)}`
                  : stats
                    ? `涨停 ${stats.limitUp}${stats.mainName ? ` · ${stats.mainName}` : ""}`
                    : statsPending
                      ? "正在取"
                      : "散户家数没有，不合成一个分"
              }
            />
            <Row
              k="主动性买盘"
              v={
                card.active == null
                  ? historical && stats
                    ? sealText(stats)
                    : "涨跌家数没有取到"
                  : `${fmtSigned(card.active, 1)}%`
              }
              hot={(card.active ?? 0) > 0}
            />
            <Row k="国家队动向" v={historical ? teamLine(data, card.teamMove) : card.teamMove} />
            <Row k="港股流动性" v={card.hkFlow} />
            <Row k="BFI 吸血/放血" v={card.bfi} />
          </Card>
          <Card title="情绪面">
            {historical && scored && data.emotion ? (
              <>
                <Row k="全市场涨跌" v={`涨 ${data.emotion.up} / 跌 ${data.emotion.down} / 平 ${data.emotion.flat}`} hot={data.emotion.up > data.emotion.down} />
                {data.breadth.total > 0 ? (
                  <Row
                    k="沪深300涨跌"
                    v={`涨 ${data.breadth.tup} / 跌 ${data.breadth.tdn} / 平 ${data.breadth.flat}`}
                    hot={data.breadth.tup > data.breadth.tdn}
                  />
                ) : (
                  <Row k="沪深300涨跌" v={basketReady ? "成分涨跌没有取全" : "正在按当前成分回看这一天"} />
                )}
              </>
            ) : null}
            <Row
              k="最高标"
              v={
                boards?.boards?.length
                  ? `${boards.boards[0]?.label ?? ""} ${boards.boards[0]?.name ?? ""} · 连板 ${boards.boards.length} 只`
                  : historical
                    ? stats
                      ? `${stats.highBoard ?? "没有连板"} · 涨停 ${stats.limitUp} · 炸板 ${stats.broken}`
                      : statsPending
                        ? "涨停池正在取"
                        : "涨停池没有取到"
                    : card.limitUp == null
                      ? "涨停家数没有取到"
                      : !statsReady
                        ? `涨停 ${card.limitUp} 家 · 连板正在取`
                        : `涨停 ${card.limitUp} 家 · ${boards == null ? "连板没有取到" : "这一天没有连板"}`
              }
            />
            {boards?.boards?.length ? <BoardList boards={boards.boards} /> : null}
            <Row
              k="涨跌情绪"
              v={
                card.mood != null
                  ? `${card.mood.toFixed(1)} / 100 · ${card.moodWord}`
                  : historical && stats
                    ? `涨停 ${stats.limitUp} / 跌停 ${stats.limitDown}${stats.seal != null ? ` · 封板 ${(stats.seal * 100).toFixed(1)}%` : ""}`
                    : historical
                      ? statsPending
                        ? "涨停池正在取"
                        : "没有这一天的涨跌家数"
                      : card.moodWord
              }
            />
            <Row k={historical ? "前一日指数冷热" : "昨恐贪"} v={card.yestGreed == null ? card.yestWord : `${card.yestGreed.toFixed(0)} · ${card.yestWord}`} />
            <Row
              k="散户情绪"
              v={
                card.retailDelta == null
                  ? historical
                    ? statsPending
                      ? "上涨家数正在取"
                      : "这一天的上涨家数没有取到"
                    : "没有涨跌家数"
                  : `${fmtSigned(card.retailDelta, 1)} · ${card.retailWord}`
              }
              hot={(card.retailDelta ?? 0) > 0}
            />
            <p className="text-[11px] text-[#6f6a62]">
              恒生科技 {data.hstech.pct == null ? "没有这一天" : fmtPct(data.hstech.pct)} · 国债{" "}
              {data.bond.pct == null ? "没有这一天" : fmtPct(data.bond.pct)} · 离岸人民币{" "}
              {data.fx.price == null ? (historical ? "这一天没有收盘" : "没有取到") : `${fmt(data.fx.price, 4)} ${fmtPct(data.fx.pct)}`}
            </p>
          </Card>
          <Card title="仓位配比 · V2">
            {card.longPct == null || card.shortPct == null ? (
              <p className="text-xs leading-relaxed text-[#b7b0a6]">
                {statsPending ? "涨跌家数正在取，取到之前不给仓位。" : `${card.positionNote}。`}
              </p>
            ) : (
              <>
            <BarRow label="长线" pct={card.longPct ?? 0} />
            <BarRow label="短线" pct={card.shortPct ?? 0} />
            <p className="num text-xs text-[#d9d3c8]">
              合计 {(card.longPct ?? 0) + (card.shortPct ?? 0)}% · 现金 {cash}% · 包络≤{(card.longPct ?? 0) + (card.shortPct ?? 0)}%
            </p>
            <p className="text-[11px] text-[#8d877d]">{card.positionNote}。这是建议姿态，不是账户持仓。</p>
              </>
            )}
          </Card>
        </div>
      </section>
    </>
  );
}

function Risk({
  data,
  card,
  cash,
  reading,
  historical,
}: {
  data: Desk;
  card: ReturnType<typeof scoreDesk>;
  cash: number | null;
  reading: ReturnType<typeof readMarket>;
  historical: boolean;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="仓位配比 · V2">
        {card.longPct == null || card.shortPct == null || cash == null ? (
          <p className="text-sm leading-relaxed text-[#b7b0a6]">{card.positionNote}。</p>
        ) : (
          <>
        <BarRow label="长线" pct={card.longPct} />
        <BarRow label="短线" pct={card.shortPct} />
        <p className="num text-sm">现金 {cash}% · {card.positionNote}</p>
        <p className="text-xs leading-relaxed text-[#b7b0a6]">{reading.detail}</p>
          </>
        )}
      </Card>
      <Card title="右侧条件">
        {historical && (data.emotion?.up ?? 0) + (data.emotion?.down ?? 0) === 0 ? (
          <p className="text-sm leading-relaxed text-[#b7b0a6]">右侧条件要看涨跌家数和跌停。这一天的数还没到。</p>
        ) : (
          reading.checks.map((item) => (
            <Row key={item.label} k={item.label} v={item.met ? `见到了 · ${item.detail}` : `还没有 · ${item.detail}`} hot={item.met} />
          ))
        )}
      </Card>
      <Card title="磨底时钟">
        <p className="text-sm leading-relaxed text-[#d9d3c8]">{reading.clock.note}</p>
        <p className="num text-xs text-[#8d877d]">
          贴低点 {reading.clock.nearDays ?? "—"} 天 · 3800 下 {reading.clock.underLine ?? "—"} 天 · 基差 {fmtSigned(data.indicators.bs)}
        </p>
      </Card>
      <Card title="融资余额">
        {data.margin.length === 0 ? (
          <p className="text-sm text-[#8d877d]">融资余额没有取到。</p>
        ) : (
          <ul className="space-y-1">
            {data.margin.slice(-6).map((day) => (
              <li key={day.date} className="flex justify-between text-xs">
                <span className="num text-[#8d877d]">{day.date}</span>
                <span className="num">{day.balanceYi.toFixed(0)} 亿</span>
                <span className={cn("num", day.netYi >= 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]")}>{fmtSigned(day.netYi, 0)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Mood({
  data,
  card,
  stats,
  boards,
  ready,
}: {
  data: Desk;
  card: ReturnType<typeof scoreDesk>;
  stats: DayStats | null;
  boards: DayStats | null;
  ready: boolean;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="涨跌情绪">
        <Row k="上涨" v={data.emotion ? String(data.emotion.up) : "—"} hot />
        <Row k="下跌" v={data.emotion ? String(data.emotion.down) : "—"} />
        <Row k="平盘" v={data.emotion ? String(data.emotion.flat) : "—"} />
        <Row k="涨停" v={shownCount(stats?.limitUp, data.emotion?.limitUp)} hot />
        <Row k="跌停" v={shownCount(stats?.limitDown, data.emotion?.limitDown)} />
        <Row
          k="涨跌情绪"
          v={
            data.emotion
              ? card.mood == null
                ? "—"
                : `${card.mood.toFixed(1)} · ${card.moodWord}`
              : stats
                ? `涨停 ${shownCount(stats.limitUp, null)} / 跌停 ${shownCount(stats.limitDown, null)}`
                : "没有这一天的涨跌家数"
          }
        />
      </Card>
      <Card title={boards?.boards.length ? `连板个股 ${boards.boards.length} 只` : "连板个股"}>
        {!ready ? (
          <p className="text-xs text-[#8d877d]">连板名单正在取。</p>
        ) : boards?.boards.length ? (
          <BoardList boards={boards.boards} />
        ) : (
          <p className="text-xs text-[#8d877d]">{boards ? "这一天没有连板。" : "连板没有取到。"}</p>
        )}
      </Card>
      <Card title="指数梯队">
        {data.ladder.map((item) => (
          <Row key={item.code} k={item.name} v={fmtPct(item.pct)} hot={(item.pct ?? 0) > 0} />
        ))}
        <Row k="创业板" v={fmtPct(data.cyb.pct)} hot={(data.cyb.pct ?? 0) > 0} />
        <Row k="恒生科技" v={fmtPct(data.hstech.pct)} hot={(data.hstech.pct ?? 0) > 0} />
        <Row k="证券" v={fmtPct(data.brokers?.pct)} hot={(data.brokers?.pct ?? 0) > 0} />
      </Card>
      <Card title="沪深300领涨">
        {data.leaders.length === 0 ? (
          <p className="text-xs text-[#8d877d]">这一天没有成分股回放。</p>
        ) : (
          data.leaders.slice(0, 5).map((row) => (
            <Row key={row.code} k={row.name} v={fmtPct(row.pct)} hot />
          ))
        )}
      </Card>
      <Card title="沪深300领跌">
        {data.laggards.length === 0 ? (
          <p className="text-xs text-[#8d877d]">这一天没有成分股回放。</p>
        ) : (
          data.laggards.slice(0, 5).map((row) => (
            <Row key={row.code} k={row.name} v={fmtPct(row.pct)} />
          ))
        )}
      </Card>
    </div>
  );
}

function Detail({
  data,
  card,
  reading,
}: {
  data: Desk;
  card: ReturnType<typeof scoreDesk>;
  reading: ReturnType<typeof readMarket>;
}) {
  const quotes = [data.sh, data.hs300, data.cyb, data.hstech, data.bond, data.fx];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card title="指数">
        {quotes.map((quote) => (
          <Row key={quote.code} k={quote.name} v={`${fmt(quote.price, quote.code === "USDCNH" ? 4 : 2)}  ${fmtPct(quote.pct)}`} hot={(quote.pct ?? 0) > 0} />
        ))}
        <Row k="两市成交" v={data.indicators.av == null ? "—" : `${data.indicators.av.toFixed(2)} 万亿`} />
        <Row k="十年国债" v={fmtPct(data.indicators.cn10, 3)} />
        <Row k="基差" v={fmtSigned(data.indicators.bs)} />
      </Card>
      <Card title="六维怎么算">
        {card.dims.map((dim) => (
          <div key={dim.label} className="border-b border-[#2c2c32] py-1.5 last:border-0">
            <div className="flex justify-between text-xs">
              <span>{dim.label}</span>
              <span className="num text-[#e6c36a]">{dim.score.toFixed(2)}/{dim.max}</span>
            </div>
            <p className="text-[11px] text-[#8d877d]">{dim.note}</p>
          </div>
        ))}
      </Card>
      <Card title="五方势力">
        {data.emotion == null ? (
          <>
            {card.arms
              .filter((arm) => arm.key !== "散户" && arm.key !== "游资")
              .map((arm) => (
                <div key={arm.key} className="border-b border-[#2c2c32] py-1.5 last:border-0">
                  <div className="flex justify-between text-xs">
                    <span>{arm.label}</span>
                    <span className="num text-[#e6c36a]">
                      {arm.score.toFixed(2)}/{arm.max.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8d877d]">{arm.note}</p>
                </div>
              ))}
            <p className="text-[11px] leading-relaxed text-[#8d877d]">全市场涨跌家数还没取到，散户和游资先不合成。</p>
          </>
        ) : (
          card.arms.map((arm) => (
            <div key={arm.key} className="border-b border-[#2c2c32] py-1.5 last:border-0">
              <div className="flex justify-between text-xs">
                <span>{arm.label}</span>
                <span className="num text-[#e6c36a]">
                  {arm.score.toFixed(2)}/{arm.max.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-[#8d877d]">{arm.note}</p>
            </div>
          ))
        )}
      </Card>
      <Card title="复盘原话">
        {data.author?.excerpt || data.author?.verdict ? (
          <>
            <p className="text-[11px] text-[#8d877d]">原文摘录</p>
            <p className="text-sm leading-relaxed">{data.author.excerpt || data.author.verdict}</p>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-[#b7b0a6]">这一天没有取到作者原文。</p>
        )}
        <p className="text-[11px] text-[#8d877d]">系统解读</p>
        <p className="text-sm leading-relaxed">{reading.headline}</p>
        <p className="text-xs leading-relaxed text-[#8d877d]">{reading.detail}</p>
        {data.author ? (
          <a href={data.author.link} target="_blank" rel="noreferrer" className="text-xs text-[#e6c36a]">
            {data.author.title}
          </a>
        ) : null}
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3">
      <h3 className="text-sm text-[#f3efe6]">{title}</h3>
      {children}
    </section>
  );
}

function applyBrief(desk: Desk, brief: DayBrief, basket: DayBasket | null): Desk {
  const next: Desk = {
    ...desk,
    author: brief.author ?? desk.author,
    feed: brief.items.length > 0 ? brief.items : desk.feed,
  };
  const market = brief.market;
  const hs = basket && basket.day === brief.day ? basket : null;
  if (!market && !hs) return next;
  const limitUp = preferCount(brief.stats?.limitUp, market?.limitUp);
  const limitDown = preferCount(brief.stats?.limitDown, market?.limitDown);
  return {
    ...next,
    emotion: market
      ? {
          date: brief.day,
          up: market.up,
          down: market.down,
          flat: market.flat,
          limitUp,
          limitDown,
        }
      : desk.emotion,
    leaders: hs?.leaders ?? [],
    laggards: hs?.laggards ?? [],
    breadth: hs
      ? {
          tup: hs.hsUp,
          tdn: hs.hsDown,
          t5u: 0,
          t5d: 0,
          d50: 0,
          u05: 0,
          flat: hs.hsFlat,
          missing: 0,
          total: hs.hsUp + hs.hsDown + hs.hsFlat,
        }
      : desk.breadth,
    warnings: carryWarnings(
      desk.warnings,
      `${brief.day} 收盘回放。${
        market ? `全市场上涨 ${market.up}、下跌 ${market.down}` : "全市场涨跌家数没有取到"
      }${hs ? `，沪深300成分上涨 ${hs.hsUp}、下跌 ${hs.hsDown}` : "，沪深300成分还在回看"}。涨跌家数是全市场公开统计。沪深300按当前成分回看这一天的涨跌，不是从复盘句子里摘的。`,
    ),
  };
}

function BoardList({ boards }: { boards: DayBoard[] }) {
  const groups = new Map<number, DayBoard[]>();
  for (const row of boards) {
    const list = groups.get(row.height);
    if (list) list.push(row);
    else groups.set(row.height, [row]);
  }
  const heights = [...groups.keys()].sort((a, b) => b - a);
  return (
    <div className="space-y-1">
      {heights.map((height) => (
        <p key={height} className="text-[11px] leading-relaxed text-[#d9d3c8]">
          <span className="text-[#ef5b4a]">{height}板</span> {groups.get(height)?.map((row) => `${row.name} ${row.label}`).join("、")}
        </p>
      ))}
    </div>
  );
}

function heatLine(stats: DayStats): string {
  const limitDown = stats.limitDown;
  const limitUp = stats.limitUp;
  const word =
    limitDown != null && limitDown >= 40
      ? "跌停偏多"
      : limitUp != null && stats.broken >= limitUp && stats.broken > 0
        ? "炸板偏多"
        : limitUp != null && limitUp >= 80
          ? "涨停偏多"
          : "不算过热";
  return `${word} · 涨停 ${limitUp ?? "未知"} · 跌停 ${limitDown ?? "未知"} · 炸板 ${stats.broken}`;
}

function mainLine(stats: DayStats): string {
  if (!stats.mainName) return "这一天的涨停题材没有取到";
  const pct = stats.mainPct == null ? "" : ` ${fmtPct(stats.mainPct)}`;
  const ups = stats.mainUps == null ? "" : ` · 涨停 ${stats.mainUps} 家`;
  return `${stats.mainName}${pct}${ups}`;
}

function toneOf(kill: string): string {
  if (kill.startsWith("放量")) return "放量";
  if (kill.startsWith("缩量")) return "缩量";
  if (kill.startsWith("平量")) return "平量";
  if (kill.startsWith("开盘")) return "开盘";
  return "量能";
}

function killLine(data: Desk, card: ReturnType<typeof scoreDesk>, stats: DayStats): string {
  const names = stats.downNames.slice(0, 3).join("、");
  const broker = data.brokers?.pct == null ? "" : ` · 证券 ${fmtPct(data.brokers.pct)}`;
  return `${toneOf(card.kill)} · 跌停 ${stats.limitDown} 家${names ? ` · ${names}` : ""}${broker}`;
}

function teamLine(data: Desk, move: string): string {
  if (move !== "看不出方向") return move;
  const a50 = data.ladder.find((item) => item.name.includes("50"))?.pct ?? null;
  const bits = [
    data.sh.pct != null ? `上证 ${fmtPct(data.sh.pct)}` : "",
    a50 != null ? `上证50 ${fmtPct(a50)}` : "",
    data.brokers?.pct != null ? `证券 ${fmtPct(data.brokers.pct)}` : "",
  ].filter(Boolean);
  return bits.length ? bits.join(" · ") : move;
}

function sealText(stats: DayStats): string {
  return stats.seal == null ? `炸板 ${stats.broken} 家` : `封板率 ${(stats.seal * 100).toFixed(1)}% · 炸板 ${stats.broken}`;
}

function Row({ k, v, hot, gold }: { k: string; v: string; hot?: boolean; gold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="shrink-0 text-[#8d877d]">{k}</span>
      <span className={cn("min-w-0 text-right", gold ? "text-[#e6c36a]" : hot ? "text-[#ef5b4a]" : "text-[#d9d3c8]")}>{v}</span>
    </div>
  );
}

function BarRow({ label, pct }: { label: string; pct: number | null }) {
  const width = pct ?? 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 text-[#8d877d]">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#2a2a30]">
        <span className="block h-full bg-[#a87888]" style={{ width: `${width}%` }} />
      </span>
      <span className="num w-10 text-right">{pct == null ? "—" : `${pct}%`}</span>
    </div>
  );
}

function TradeDay({ days, value, onChange }: { days: string[]; value: string; onChange: (day: string) => void }) {
  if (!value || days.length === 0) return null;
  const year = value.slice(0, 4);
  const month = value.slice(5, 7);
  const day = value.slice(8, 10);
  const years = [...new Set(days.map((item) => item.slice(0, 4)))];
  const months = [...new Set(days.filter((item) => item.startsWith(year)).map((item) => item.slice(5, 7)))];
  const dates = days.filter((item) => item.startsWith(`${year}-${month}`));
  const select = "h-7 rounded-full border border-white/15 bg-black/25 px-1.5 text-white [color-scheme:dark]";
  function snap(nextYear: string, nextMonth: string, nextDay: string) {
    const inMonth = days.filter((item) => item.startsWith(`${nextYear}-${nextMonth}`));
    const pool = inMonth.length > 0 ? inMonth : days.filter((item) => item.startsWith(nextYear));
    if (pool.length === 0) return;
    const target = `${nextYear}-${nextMonth}-${nextDay}`;
    const exact = pool.find((item) => item === target);
    const picked = exact ?? [...pool].reverse().find((item) => item <= target) ?? pool[0];
    if (!picked || picked === value) return;
    onChange(picked);
  }
  return (
    <span className="inline-flex items-center gap-1">
      <select aria-label="交易年" className={select} value={year} onChange={(event) => snap(event.target.value, month, day)}>
        {years.map((item) => (
          <option key={item} value={item}>
            {item}年
          </option>
        ))}
      </select>
      <select aria-label="交易月" className={select} value={month} onChange={(event) => snap(year, event.target.value, day)}>
        {months.map((item) => (
          <option key={item} value={item}>
            {item}月
          </option>
        ))}
      </select>
      <select
        aria-label="交易日"
        className={select}
        value={dates.some((item) => item.slice(8, 10) === day) ? day : day}
        onChange={(event) => snap(year, month, event.target.value)}
      >
        {dates.map((item) => (
          <option key={item} value={item.slice(8, 10)}>
            {item.slice(8, 10)}日
          </option>
        ))}
      </select>
    </span>
  );
}

function Legend({ swatch, text }: { swatch: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[#d9d3c8]">
      <span className="size-2 rounded-sm" style={{ background: swatch }} />
      {text}
    </span>
  );
}

function ForceTick({
  x = 0,
  y = 0,
  payload,
  arms,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string };
  arms: Arm[];
}) {
  const arm = arms.find((item) => item.label === payload?.value);
  return (
    <text x={x} y={y} textAnchor="middle" fill="#d9d3c8" fontSize={11}>
      <tspan x={x} dy={0}>
        {payload?.value}
      </tspan>
      <tspan x={x} dy={13} fill="#e6c36a" fontSize={10}>
        {arm ? `${arm.score.toFixed(2)}/${arm.max.toFixed(2)}` : ""}
      </tspan>
    </text>
  );
}

function shiftIso(iso: string, days: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function joinIso(y: number, m: number, d: number) {
  const dim = new Date(y, m, 0).getDate();
  const day = Math.min(Math.max(1, d), dim);
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function Ymd({
  value,
  min,
  max,
  onChange,
}: {
  value: string;
  min: string;
  max: string;
  onChange: (iso: string) => void;
}) {
  const [ys, ms, ds] = (value || min).split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const y0 = Number(min.slice(0, 4));
  const y1 = Number(max.slice(0, 4));
  const years: number[] = [];
  for (let i = y0; i <= y1; i++) years.push(i);
  const m0 = y === y0 ? Number(min.slice(5, 7)) : 1;
  const m1 = y === y1 ? Number(max.slice(5, 7)) : 12;
  const months: number[] = [];
  for (let i = m0; i <= m1; i++) months.push(i);
  const dim = new Date(y, m, 0).getDate();
  let d0 = 1;
  let d1 = dim;
  if (y === y0 && m === Number(min.slice(5, 7))) d0 = Number(min.slice(8, 10));
  if (y === y1 && m === Number(max.slice(5, 7))) d1 = Math.min(d1, Number(max.slice(8, 10)));
  const days: number[] = [];
  for (let i = d0; i <= Math.max(d0, d1); i++) days.push(i);
  const select =
    "h-9 rounded-md border border-[#3a3a42] bg-[#121214] px-1.5 text-[#f3efe6] [color-scheme:dark]";
  function emit(ny: number, nm: number, nd: number) {
    let next = joinIso(ny, nm, nd);
    if (next < min) next = min;
    if (next > max) next = max;
    onChange(next);
  }
  return (
    <span className="inline-flex items-center gap-1">
      <select aria-label="年" className={select} value={y} onChange={(event) => emit(Number(event.target.value), m, d)}>
        {years.map((n) => (
          <option key={n} value={n}>
            {n}年
          </option>
        ))}
      </select>
      <select aria-label="月" className={select} value={m} onChange={(event) => emit(y, Number(event.target.value), d)}>
        {months.map((n) => (
          <option key={n} value={n}>
            {String(n).padStart(2, "0")}月
          </option>
        ))}
      </select>
      <select
        aria-label="日"
        className={select}
        value={Math.min(Math.max(d, d0), d1 || d0)}
        onChange={(event) => emit(y, m, Number(event.target.value))}
      >
        {days.map((n) => (
          <option key={n} value={n}>
            {String(n).padStart(2, "0")}日
          </option>
        ))}
      </select>
    </span>
  );
}

function MarkDot(props: unknown) {
  const { cx, cy, payload, key } = props as { cx?: number; cy?: number; payload?: ScoreDay; key?: string };
  if (cx == null || cy == null || !payload?.mark) return <g key={key} />;
  const sell = payload.mark === "卖";
  return (
    <g key={key}>
      <circle cx={cx} cy={cy} r={8} fill={sell ? "#1f8f5f" : "#d4533c"} />
      <text x={cx} y={cy + 3} textAnchor="middle" fontSize={9} fill="#fff">
        {payload.mark}
      </text>
    </g>
  );
}

function VolBar(props: unknown) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props as {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: ScoreDay;
  };
  return <rect x={x} y={y} width={Math.max(width - 2, 1)} height={height} fill={payload?.up ? "#ef5b4a" : "#1f8f5f"} />;
}

function ChartTip(props: unknown) {
  const { active, label, payload } = props as {
    active?: boolean;
    label?: string | number;
    payload?: Array<{ payload?: ScoreDay; dataKey?: string | number }>;
  };
  if (!active) return null;
  const date = label == null ? "" : String(label);
  const row =
    payload?.find((item) => item.dataKey === "rate" && item.payload)?.payload ??
    payload?.find((item) => item.payload?.date === date)?.payload;
  if (!row) return null;
  const shown = date || row.date;
  return (
    <div className="rounded-lg border border-[#3a3a42] bg-[#121214] px-2 py-1 text-[11px]">
      <p className="num text-[#8d877d]">{shown}</p>
      <p className="num">得分 {row.rate == null ? "缺口" : row.rate.toFixed(1)} · 势力 {row.force == null ? "—" : row.force.toFixed(1)}</p>
      <p className="num">上证 {fmtPct(row.sh)}</p>
    </div>
  );
}
