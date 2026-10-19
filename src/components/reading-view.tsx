import type { Desk } from "@/lib/market.types";
import { cn } from "@/lib/cn";
import { fmt, fmtPct, fmtSigned } from "@/lib/format";
import { readMarket, stateWordOf, type Spoke, type StepState } from "@/lib/reading";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export function ReadingView({ data }: { data: Desk }) {
  const reading = readMarket(data);
  const emotion = data.emotion;
  const maxNet = Math.max(1, ...data.margin.map((day) => Math.abs(day.netYi)));

  return (
    <section className="space-y-4">
      {data.author ? (
        <a
          href={data.author.link}
          target="_blank"
          rel="noreferrer"
          className="block rounded-3xl border border-line bg-panel p-4"
        >
          <p className="text-xs text-faint">最近一篇复盘 · 原文</p>
          <p className="mt-1 text-sm text-paper">{data.author.title}</p>
          {data.author.verdict ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">{data.author.verdict}</p>
          ) : null}
        </a>
      ) : null}

      <div className="rounded-3xl border border-line bg-panel p-4 md:p-5">
        <p className="font-serif text-xs tracking-widest text-faint">HOW HE READS IT</p>
        <h2 className="mt-1 text-xl font-medium tracking-tight">用同一套流程看这批数字</h2>
        <p className="mt-3 text-base leading-relaxed text-paper">{reading.headline}</p>
        <RadarPanel spokes={reading.spokes} />
        <p className="mt-2 text-sm leading-relaxed text-muted">{reading.detail}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Fact title="两层底" value={reading.phase} text={reading.phaseNote} />
          <Fact title="护盘力度" value={reading.force.label} text={reading.force.note} />
          <Fact
            title="磨了多久"
            value={
              reading.clock.shape === "未知"
                ? "算不出"
                : `${reading.clock.shape} · 贴低 ${reading.clock.nearDays ?? "—"} 日`
            }
            text={reading.clock.note}
          />
          <Fact title="仓位" value={reading.phase === "右侧靠近" ? "底仓，别梭" : "试多 ≠ 重仓"} text={reading.position} />
        </div>
        <p className="mt-3 text-xs text-faint">
          这不是作者当天写的复盘。框架来自公开日评里反复出现的护盘底和市场底、止跌顺序、三种护盘力度、剪刀差、杠杆和周线。数字对不上就不下结论。口径在「口径」页。
        </p>
      </div>

      <ol className="grid gap-3 md:grid-cols-2">
        {reading.steps.map((step, index) => (
          <li key={step.title} className="rounded-2xl border border-line bg-panel p-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm text-paper">
                <span className="num text-faint">{index + 1}</span> {step.title}
              </p>
              <p className={cn("text-xs", stateClass(step.state))}>{stateWordOf(step.state)}</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.evidence}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-3 lg:grid-cols-2">
        <article className="rounded-3xl border border-line bg-panel p-4">
          <h3 className="text-sm font-medium">赚钱效应</h3>
          {emotion ? (
            <>
              <p className="num mt-3 text-2xl text-paper">
                <span className="text-up">{emotion.up}</span>
                <span className="text-faint"> / </span>
                <span className="text-down">{emotion.down}</span>
              </p>
              <p className="mt-1 text-xs text-faint">
                上涨 / 下跌 · 平 {emotion.flat} · 涨停 {emotion.limitUp ?? "未知"} · 跌停 {emotion.limitDown ?? "未知"}
              </p>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-panel-2">
                <span className="bg-up" style={{ width: `${(emotion.up / Math.max(1, emotion.up + emotion.down)) * 100}%` }} />
                <span className="bg-down" style={{ width: `${(emotion.down / Math.max(1, emotion.up + emotion.down)) * 100}%` }} />
              </div>
              <p className="num mt-2 text-xs text-faint">{emotion.date}</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">全市场涨跌没有取到。</p>
          )}
        </article>

        <article className="rounded-3xl border border-line bg-panel p-4">
          <h3 className="text-sm font-medium">止跌从大票到小票</h3>
          <ul className="mt-3 space-y-2">
            {data.ladder.map((item) => (
              <li key={item.code} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-muted">{item.name.replace(/指数/g, "")}</span>
                <span className={cn("num", item.pct != null && item.pct > 0 ? "text-up" : item.pct != null && item.pct < 0 ? "text-down" : "text-muted")}>
                  {fmtPct(item.pct)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-faint">顺序来自止跌流程：先上证50和沪深300，再到500、1000、小票。小票用国证2000。</p>
        </article>

        <article className="rounded-3xl border border-line bg-panel p-4">
          <h3 className="text-sm font-medium">剪刀差</h3>
          <p className="mt-3 text-sm text-muted">
            沪深300对国证2000
            <span className="num text-paper"> {fmtSigned(reading.gapBig)} </span>
            个百分点
          </p>
          <p className="mt-1 text-sm text-muted">
            上证对创业板
            <span className="num text-paper"> {fmtSigned(reading.gapStyle)} </span>
            个百分点
          </p>
          <p className="mt-1 text-sm text-muted">
            上证对恒生科技
            <span className="num text-paper"> {fmtSigned(reading.gapForeign)} </span>
            个百分点
          </p>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            他们把绝对差 0.5 以上叫有分歧，1 以上叫较重，2 以上叫严重。机构端和小票端、传统和新兴，差大了，单边就不容易持续。
          </p>
        </article>

        <article className="rounded-3xl border border-line bg-panel p-4">
          <h3 className="text-sm font-medium">杠杆哥</h3>
          {data.margin.length > 0 ? (
            <>
              <p className="mt-3 text-sm text-muted">
                连撤 <span className="num text-paper">{reading.marginStreak}</span> 天 · 余额{" "}
                <span className="num text-paper">{fmt(data.margin[data.margin.length - 1]?.balanceYi, 0)}</span> 亿
              </p>
              <div className="mt-3 flex h-16 items-end gap-1">
                {data.margin.map((day) => (
                  <span
                    key={day.date}
                    title={`${day.date} 净买入 ${fmtSigned(day.netYi, 0)} 亿`}
                    className={cn("min-w-0 flex-1 rounded-sm", day.netYi >= 0 ? "bg-up" : "bg-down")}
                    style={{ height: `${Math.max(8, (Math.abs(day.netYi) / maxNet) * 100)}%` }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-faint">
                每根是当日融资净买入。余额通常晚一个交易日，所以最新一根可能还不是行情当天。
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">融资余额没有取到。</p>
          )}
        </article>
      </div>

      <section className="rounded-3xl border border-line bg-panel p-4">
        <h3 className="text-sm font-medium">右侧还缺什么</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {reading.checks.map((item) => (
            <li key={item.label} className="rounded-xl border border-line px-3 py-2">
              <p className="text-sm text-paper">
                <span className={item.met ? "text-paper" : "text-faint"}>{item.met ? "有" : "没有"}</span>
                <span className="ml-2">{item.label}</span>
              </p>
              <p className="mt-1 text-xs text-muted">{item.detail}</p>
            </li>
          ))}
        </ul>
        {reading.weeks.length > 0 ? (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {reading.weeks.map((week) => (
              <div key={week.label} className="min-w-14">
                <p className={cn("num text-xs", week.ret >= 0 ? "text-up" : "text-down")}>{fmtPct(week.ret, 1)}</p>
                <p className="num text-xs text-faint">{week.label}</p>
              </div>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-xs text-faint">上证周涨跌。日线吵一天，他们要拉周线看。</p>
      </section>
    </section>
  );
}

function RadarPanel({ spokes }: { spokes: Spoke[] }) {
  const thin = spokes.filter((item) => item.score < 40).map((item) => item.label);
  return (
    <div className="mt-4 rounded-2xl border border-line bg-panel-2 p-3 md:p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">七件事走到哪</h3>
        <p className="text-xs text-faint">外圈是齐了</p>
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-5 lg:items-center">
        <div className="h-72 lg:col-span-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={spokes} cx="50%" cy="50%" outerRadius="68%" margin={{ top: 12, right: 28, bottom: 12, left: 28 }}>
              <PolarGrid stroke="#3a342c" />
              <PolarAngleAxis dataKey="axis" tick={{ fill: "#a39b90", fontSize: 12 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                dataKey="score"
                stroke="#c4523a"
                fill="#c4523a"
                fillOpacity={0.22}
                strokeWidth={1.5}
                isAnimationActive={false}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as Spoke;
                  return (
                    <div className="max-w-48 rounded-lg border border-line bg-panel px-3 py-2">
                      <p className="text-xs text-paper">{row.label}</p>
                      <p className="num text-sm text-paper">{row.score}</p>
                      <p className="text-xs text-muted">{row.note}</p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <ul className="space-y-3 lg:col-span-2">
          {spokes.map((item) => (
            <li key={item.label}>
              <div className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
                <span className="text-xs text-muted">{item.label}</span>
                <span className="h-1 overflow-hidden rounded-full bg-ink">
                  <span className="block h-full bg-seal" style={{ width: `${item.score}%` }} />
                </span>
                <span className="num text-right text-xs text-paper">{item.score}</span>
              </div>
              <p className="mt-1 text-xs text-faint">{item.note}</p>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-faint">
        这七条是日评里反复拿来决定右侧有没有的事。0 在中心，100 在外圈。
        {thin.length > 0 ? `现在最空的是${thin.join("、")}。` : "这几条大体都转过来了，仍然不是梭哈。"}
        基差贴水再深也不画进来，旧色带分不出程度。
      </p>
    </div>
  );
}

function stateClass(state: StepState): string {
  if (state === "met") return "text-paper";
  if (state === "partial") return "text-warn";
  return "text-faint";
}

function Fact({ title, value, text }: { title: string; value: string; text: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel-2 px-3 py-3">
      <p className="text-xs text-faint">{title}</p>
      <p className="mt-1 text-sm text-paper">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">{text}</p>
    </div>
  );
}
