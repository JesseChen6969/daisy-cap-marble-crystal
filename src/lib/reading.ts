import { fmt, fmtPct, fmtSigned } from "./format";
import type { Bar, Desk, LadderQuote, MarginDay } from "./market.types";

export type StepState = "met" | "partial" | "waiting";

export type ReadStep = {
  title: string;
  state: StepState;
  evidence: string;
};

export type Check = {
  label: string;
  met: boolean;
  detail: string;
};

export type WeekBar = {
  label: string;
  ret: number;
};

export type PathClock = {
  underLine: number | null;
  fromHigh: number | null;
  fromLow: number | null;
  nearDays: number | null;
  bounce: number | null;
  shape: "V" | "U" | "磨" | "未知";
  note: string;
};

export type ForceRead = {
  label: string;
  note: string;
};

export type Spoke = {
  axis: string;
  label: string;
  score: number;
  note: string;
};

export type ForceArm = {
  axis: string;
  label: string;
  score: number;
  max: number;
  note: string;
};

export type Board = {
  rate: number;
  band: string;
  pattern: string;
  patternNote: string;
  heat: string;
  quiet: string;
  forces: ForceArm[];
  forceSum: number;
  forceMax: number;
};

export type Reading = {
  headline: string;
  detail: string;
  phase: string;
  phaseNote: string;
  position: string;
  clock: PathClock;
  force: ForceRead;
  spokes: Spoke[];
  board: Board;
  steps: ReadStep[];
  checks: Check[];
  weeks: WeekBar[];
  gapBig: number | null;
  gapStyle: number | null;
  gapForeign: number | null;
  marginStreak: number;
  nearLow: number | null;
};

const LINE = 3800;

function weekKey(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const weekday = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - weekday);
  const start = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${dt.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}

export function weeklyReturns(bars: Bar[]): WeekBar[] {
  const last = new Map<string, Bar>();
  for (const bar of bars) {
    if (!bar.date) continue;
    last.set(weekKey(bar.date), bar);
  }
  const closes = [...last.values()];
  const out: WeekBar[] = [];
  for (let i = 1; i < closes.length; i += 1) {
    const prev = closes[i - 1]?.close;
    const curr = closes[i];
    if (!curr || !prev) continue;
    out.push({ label: curr.date.slice(5), ret: ((curr.close - prev) / prev) * 100 });
  }
  return out.slice(-8);
}

function trailingFalls(days: MarginDay[]): number {
  let count = 0;
  for (let i = days.length - 1; i > 0; i -= 1) {
    const curr = days[i]?.balanceYi;
    const prev = days[i - 1]?.balanceYi;
    if (curr == null || prev == null || curr >= prev - 0.5) break;
    count += 1;
  }
  return count;
}

function findName(ladder: LadderQuote[], needle: string): LadderQuote | undefined {
  return ladder.find((item) => item.name.includes(needle));
}

function gapWords(gap: number | null): string {
  if (gap == null) return "算不出";
  const size = Math.abs(gap);
  if (size >= 2) return "分歧严重";
  if (size >= 1) return "分歧较重";
  if (size >= 0.5) return "有分歧";
  return "没有明显分歧";
}

function stateWord(state: StepState): string {
  if (state === "met") return "见到了";
  if (state === "partial") return "有迹象";
  return "还没有";
}

export function stateWordOf(state: StepState): string {
  return stateWord(state);
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function readSpokes(input: {
  emotion: Desk["emotion"];
  shPrice: number | null;
  shPct: number | null;
  cybPct: number | null;
  gapBig: number | null;
  brokersPct: number | null;
  marginStreak: number;
  marginKnown: boolean;
  av: number | null;
  downWeeks: number;
  weeksKnown: boolean;
}): Spoke[] {
  const { emotion } = input;
  let breadth = 0;
  let breadthNote = "全市场涨跌没有取到";
  if (emotion && emotion.up + emotion.down > 0) {
    const ratio = (emotion.up / (emotion.up + emotion.down)) * 100;
    breadth = ratio;
    if (emotion.limitDown != null && emotion.limitDown <= 15) breadth += 8;
    if (emotion.limitDown != null && emotion.limitDown >= 40) breadth = Math.min(breadth, 22);
    else if (emotion.limitDown != null && emotion.limitDown >= 20) breadth = Math.min(breadth, 42);
    if (emotion.up <= emotion.down) breadth = Math.min(breadth, 38);
    breadthNote = `上涨 ${emotion.up}，下跌 ${emotion.down}，跌停 ${emotion.limitDown ?? "未知"}`;
  }

  let line = 0;
  let lineNote = "上证没有取到";
  if (input.shPrice != null) {
    const gap = LINE - input.shPrice;
    line = gap <= 0 ? 82 + Math.min(18, -gap / 40 * 18) : 42 * (1 - Math.min(1, gap / 160));
    lineNote = gap <= 0 ? `收在 ${fmt(input.shPrice, 0)}，站上 3800` : `收在 ${fmt(input.shPrice, 0)}，还在 3800 下`;
  }

  let structure = 0;
  let structureNote = "上证和创业板没有对照上";
  if (input.shPct != null && input.cybPct != null) {
    const lead = input.shPct - input.cybPct;
    structure = 48 + lead * 22;
    if (input.cybPct <= 0 && lead >= 0) structure += 14;
    if (input.cybPct > input.shPct + 0.8) structure = Math.min(structure, 26);
    if (input.gapBig != null && Math.abs(input.gapBig) >= 2) structure -= 16;
    else if (input.gapBig != null && Math.abs(input.gapBig) >= 1) structure -= 8;
    structureNote = `上证 ${fmtPct(input.shPct)}，创业板 ${fmtPct(input.cybPct)}`;
  }

  let mood = 0;
  let moodNote = "证券指数没有取到";
  if (input.brokersPct != null) {
    mood = 38 + input.brokersPct * 30;
    if (input.brokersPct <= 0) mood = Math.min(mood, 34);
    moodNote = `证券公司 ${fmtPct(input.brokersPct)}`;
  }

  let leverage = 0;
  let leverageNote = "融资余额没有取到";
  if (input.marginKnown) {
    leverage = input.marginStreak === 0 ? 68 : 72 - input.marginStreak * 13;
    leverageNote = input.marginStreak > 0 ? `融资连撤 ${input.marginStreak} 天` : "融资这几天没有继续撤";
  }

  let volume = 0;
  let volumeNote = "成交额没有取到";
  if (input.av != null) {
    volume = input.av < 1.8 ? 18 + Math.max(0, input.av - 0.8) * 32 : 52 + (input.av - 1.8) * 55;
    volumeNote = `沪深成交 ${fmt(input.av)} 万亿`;
  }

  let week = 0;
  let weekNote = "周线没有取到";
  if (input.weeksKnown) {
    week = input.downWeeks === 0 ? 84 : 78 - input.downWeeks * 16;
    weekNote = input.downWeeks > 0 ? `上证周线连跌 ${input.downWeeks} 周` : "上证周线这周没有再跌";
  }

  return [
    { axis: "效应", label: "赚钱效应", score: clampScore(breadth), note: breadthNote },
    { axis: "护盘", label: "护盘线", score: clampScore(line), note: lineNote },
    { axis: "结构", label: "盘面结构", score: clampScore(structure), note: structureNote },
    { axis: "证券", label: "气氛组", score: clampScore(mood), note: moodNote },
    { axis: "杠杆", label: "杠杆", score: clampScore(leverage), note: leverageNote },
    { axis: "量能", label: "量能", score: clampScore(volume), note: volumeNote },
    { axis: "周线", label: "周线", score: clampScore(week), note: weekNote },
  ];
}

function clampTo(n: number, max: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}

function readBoard(input: {
  desk: Desk;
  spokes: Spoke[];
  gapBig: number | null;
  forceLabel: string;
  healed: boolean;
  panic: boolean;
  volumeHot: boolean;
}): Board {
  const { desk, spokes } = input;
  const { emotion, sh, cyb, hs300, hstech, brokers, ladder } = desk;
  const a50 = findName(ladder, "50");

  let inst = 10 + (input.gapBig ?? 0) * 5;
  if ((hs300.pct ?? 0) < -1) inst -= 6;
  if ((hs300.pct ?? 0) > 0.8) inst += 4;

  let team = 4;
  if (emotion?.limitDown != null && emotion.limitDown <= 15) team += 6;
  if (emotion?.limitDown != null && emotion.limitDown >= 40) team -= 6;
  if ((a50?.pct ?? -1) >= -0.3) team += 4;
  if (sh.price != null && sh.price >= LINE) team += 10;
  else if (sh.price != null && sh.price >= 3750) team += 2;
  if (input.forceLabel === "小维护") team += 3;
  if (input.forceLabel === "像一起拉") team += 6;

  const foreign = hstech.pct == null ? 0 : 6 + hstech.pct * 2.5;

  let retail = 0;
  if (emotion && emotion.up + emotion.down > 0) {
    retail = (emotion.up / (emotion.up + emotion.down)) * 22;
    if (emotion.limitUp != null && emotion.limitUp >= 80) retail += 5;
    if (emotion.limitDown != null && emotion.limitDown >= 40) retail = Math.min(retail, 8);
  }

  let hot = emotion?.limitUp != null ? Math.min(14, emotion.limitUp / 6) : 0;
  if ((cyb.pct ?? 0) > 0.6) hot += 5;
  if ((brokers?.pct ?? -1) > 0) hot += 4;
  if ((cyb.pct ?? 0) < -0.3) hot -= 3;

  const forces: ForceArm[] = [
    {
      axis: "机构",
      label: "机构",
      score: clampTo(inst, 25),
      max: 25,
      note: input.gapBig != null ? `沪深300对国证2000 ${fmtSigned(input.gapBig)}` : "大小票对照没有取到",
    },
    {
      axis: "国家队",
      label: "国家队",
      score: clampTo(team, 30),
      max: 30,
      note: sh.price != null ? `上证 ${fmt(sh.price, 0)}，上证50 ${fmtPct(a50?.pct)}` : "权重没有取到",
    },
    {
      axis: "外资",
      label: "外资",
      score: clampTo(foreign, 15),
      max: 15,
      note: hstech.pct != null ? `恒生科技 ${fmtPct(hstech.pct)}` : "恒生科技没有取到",
    },
    {
      axis: "散户",
      label: "散户",
      score: clampTo(retail, 31),
      max: 31,
      note: emotion ? `上涨 ${emotion.up} / 下跌 ${emotion.down}` : "涨跌家数没有取到",
    },
    {
      axis: "游资",
      label: "游资",
      score: clampTo(hot, 25),
      max: 25,
      note: emotion?.limitUp != null ? `涨停 ${emotion.limitUp}，创业板 ${fmtPct(cyb.pct)}` : "涨停家数没有取到",
    },
  ];
  const forceSum = forces.reduce((sum, arm) => sum + arm.score, 0);
  const forceMax = forces.reduce((sum, arm) => sum + arm.max, 0);
  const rate = spokes.length ? spokes.reduce((sum, item) => sum + item.score, 0) / spokes.length : 0;

  const limitsKnown = emotion != null && emotion.limitDown != null && emotion.limitUp != null;
  const breadthKnown = emotion != null && emotion.up + emotion.down > 0;
  let band = "观望";
  if (!breadthKnown || !limitsKnown) band = "数据不足";
  else if (input.panic) band = "回避";
  else if (rate >= 60) band = "做多";
  else if (rate >= 40) band = "一般";
  else if (input.healed) band = "磨底";

  let pattern = "磨底市";
  if (input.panic) pattern = "恐慌市";
  else if (input.forceLabel === "小维护" || input.forceLabel === "像一起拉") pattern = "护盘市";
  else if (input.forceLabel === "结构不对") pattern = "错位市";

  let heat = "一般";
  if (input.panic || (emotion?.limitDown != null && emotion.limitDown >= 40)) heat = "短期冰点";
  else if (emotion?.limitUp != null && emotion.limitUp >= 90 && emotion.up > emotion.down * 1.8) heat = "过热";
  else if (input.healed && !input.volumeHot) heat = "不热";

  const quiet =
    sh.pct != null && cyb.pct != null && Math.abs(sh.pct) < 0.8 && Math.abs(cyb.pct) < 1.2 ? "安静" : "有波动";

  return {
    rate,
    band,
    pattern,
    patternNote: input.forceLabel,
    heat,
    quiet,
    forces,
    forceSum,
    forceMax,
  };
}

function readClock(bars: Bar[], price: number | null): PathClock {
  if (bars.length < 8) {
    return {
      underLine: null,
      fromHigh: null,
      fromLow: null,
      nearDays: null,
      bounce: null,
      shape: "未知",
      note: "上证日线不够，磨了多久先不算。",
    };
  }
  let underLine = 0;
  for (let i = bars.length - 1; i >= 0; i -= 1) {
    if (bars[i].close >= LINE) break;
    underLine += 1;
  }
  const window = bars.slice(-40);
  let lowIdx = 0;
  for (let i = 1; i < window.length; i += 1) {
    if (window[i].low < window[lowIdx].low) lowIdx = i;
  }
  let highIdx = 0;
  for (let i = 0; i <= lowIdx; i += 1) {
    if (window[i].high >= window[highIdx].high) highIdx = i;
  }
  const fromHigh = window.length - 1 - highIdx;
  const fromLow = window.length - 1 - lowIdx;
  const low = window[lowIdx].low;
  const lastClose = price ?? window[window.length - 1]?.close ?? low;
  const bounce = low > 0 ? ((lastClose - low) / low) * 100 : null;
  const camp = low * 1.015;
  let campStart = window.length - 1;
  for (let i = window.length - 1; i >= 0; i -= 1) {
    const bar = window[i];
    if (bar.low <= camp || bar.close <= camp) campStart = i;
    else break;
  }
  const nearDays = window.length - campStart;
  let shape: PathClock["shape"] = "磨";
  if (bounce != null && fromLow <= 2 && bounce >= 1.2) shape = "V";
  else if (bounce != null && fromLow >= 3 && bounce < 2.5) shape = "U";
  const shapeWord =
    shape === "V"
      ? "这根是拉起来的 V。他们写过，走 V 容易被按下去，走 U 才耐得住。"
      : shape === "U"
        ? "更像贴着低点磨的 U。他们把 U 看成比 V 更有持续性的那种底。"
        : fromLow <= 2
          ? "低点就在旁边，还看不出会走成 V 还是 U。"
          : "还在高低之间晃，既不是一根 V 拉起来，也还没磨成贴地的 U。";
  const timeWord =
    nearDays < 11
      ? `贴着这段低点 ${nearDays} 个交易日，短于他们对照过的 11、12、17 日，所以时间还不够。`
      : nearDays < 17
        ? `贴着低点 ${nearDays} 个交易日，接近较短的那几次磨底。天数到了也不等于成功，还得看结构。`
        : `贴着低点已经 ${nearDays} 个交易日，不短于他们举过的例子。成不成功，还是看有没有换成非科技带队。`;
  return {
    underLine,
    fromHigh,
    fromLow,
    nearDays,
    bounce,
    shape,
    note: `收盘连续 ${underLine} 天在 3800 下。${timeWord}从高点下来 ${fromHigh} 个交易日，那是下跌的长度，不是磨底的长度。离低点 ${fromLow} 天，反弹 ${bounce == null ? "—" : bounce.toFixed(1)}%。${shapeWord}`,
  };
}

function readForce(
  ladder: LadderQuote[],
  hs300Pct: number | null,
  shPct: number | null,
  cybPct: number | null,
  volumeHot: boolean,
): ForceRead {
  const a50 = findName(ladder, "50");
  const a500 = findName(ladder, "500");
  const a1000 = findName(ladder, "1000");
  const small = findName(ladder, "2000");
  if (a50?.pct == null || hs300Pct == null) {
    return { label: "看不清", note: "权重指数不齐，护盘力度先不下判断。" };
  }
  const mids = [a50.pct, hs300Pct, a500?.pct].filter((n): n is number => n != null);
  const weightsOk = mids.every((n) => n > -0.3);
  const smallLag = small?.pct != null && a50.pct - small.pct > 0.4;
  const techHot = cybPct != null && shPct != null && cybPct > shPct + 0.5;
  const broad = [a50.pct, hs300Pct, a500?.pct, a1000?.pct, cybPct].every((n) => n != null && n > 0.6);
  if (broad && volumeHot) {
    return {
      label: "像一起拉",
      note: "宽基、小票、创业板一起明显转强，而且成交不轻。是不是开会、发利好，行情里看不出来。他们写过，这个位置如果非要大救市，反而要离远一点。",
    };
  }
  if (techHot && !weightsOk) {
    return {
      label: "结构不对",
      note: "科技还在抢风头，权重没有站住。他们把这种日子看成流程没走完：没钱硬拉科技，会跌得更深。",
    };
  }
  if (weightsOk && (smallLag || (cybPct != null && shPct != null && cybPct < shPct))) {
    return {
      label: "小维护",
      note: "上证50、沪深300比创业板稳，跌速被按住了，但不是把指数直接拉起来。三板斧里的买宽基、发利好，这组数字对不上，就不算数。",
    };
  }
  return {
    label: "不好归类",
    note: "指数彼此差不多，看不出是在拉权重，还是市场自己在磨。",
  };
}

export function readMarket(desk: Desk): Reading {
  const { sh, cyb, hs300, emotion, ladder, brokers, margin, indicators } = desk;
  const weeks = weeklyReturns(desk.shSeries.length > 0 ? desk.shSeries : desk.series);
  let downWeeks = 0;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if ((weeks[i]?.ret ?? 0) >= 0) break;
    downWeeks += 1;
  }
  const recent = (desk.shSeries.length > 0 ? desk.shSeries : desk.series).slice(-20);
  const low = recent.reduce((min, bar) => Math.min(min, bar.low), Number.POSITIVE_INFINITY);
  const nearLow =
    sh.price != null && Number.isFinite(low) && low > 0 ? ((sh.price - low) / low) * 100 : null;

  const gz = findName(ladder, "2000");
  const gapBig = hs300.pct != null && gz?.pct != null ? hs300.pct - gz.pct : null;
  const gapStyle = sh.pct != null && cyb.pct != null ? sh.pct - cyb.pct : null;
  const gapForeign = sh.pct != null && desk.hstech.pct != null ? sh.pct - desk.hstech.pct : null;
  const marginStreak = trailingFalls(margin);
  const lastNet = margin.length ? margin[margin.length - 1] : null;
  const clock = readClock(desk.shSeries.length > 0 ? desk.shSeries : desk.series, sh.price);
  const volumeHot = indicators.av != null && indicators.av >= 2;

  const healed = emotion != null && emotion.limitDown != null && emotion.limitDown <= 15 && emotion.up > emotion.down;
  const panic = emotion != null && emotion.limitDown != null && emotion.limitDown >= 40;
  const belowLine = sh.price != null && sh.price < LINE;
  const techQuiet =
    cyb.pct != null && sh.pct != null && cyb.pct <= 0 && sh.pct >= cyb.pct;
  const brokersWeak = brokers?.pct == null || brokers.pct <= 0;
  const aboveLow = nearLow != null && nearLow <= 4;

  const lineBack = sh.price != null && sh.price >= LINE;
  const marginStopped = margin.length >= 2 && marginStreak === 0;
  const brokersOk = brokers?.pct != null && brokers.pct > 0;
  const volumeOk = indicators.av != null && indicators.av >= 1.8;
  const weekOk = weeks.length > 0 && downWeeks === 0;
  const force = readForce(ladder, hs300.pct, sh.pct, cyb.pct, volumeHot);

  const checks: Check[] = [
    {
      label: "融资不再连撤",
      met: marginStopped,
      detail: margin.length
        ? `已连撤 ${marginStreak} 天，最近一日净买入 ${fmtSigned(lastNet?.netYi, 0)} 亿`
        : "融资余额没有取到",
    },
    {
      label: "上证收回 3800",
      met: lineBack,
      detail: sh.price != null ? `收在 ${fmt(sh.price, 0)}，复盘里把 3800 写成龙哥的线` : "上证没有取到",
    },
    {
      label: "证券气氛组转强",
      met: brokersOk,
      detail: brokers?.pct != null ? `证券公司 ${fmtPct(brokers.pct)}` : "证券指数没有取到",
    },
    {
      label: "成交出现增量",
      met: volumeOk,
      detail: indicators.av != null ? `沪深成交 ${fmt(indicators.av)} 万亿` : "成交额没有取到",
    },
    {
      label: "周线停止连跌",
      met: weekOk,
      detail: weeks.length ? `上证周线已连跌 ${downWeeks} 周` : "周线没有取到",
    },
  ];

  const spokes = readSpokes({
    emotion,
    shPrice: sh.price,
    shPct: sh.pct,
    cybPct: cyb.pct,
    gapBig,
    brokersPct: brokers?.pct ?? null,
    marginStreak,
    marginKnown: margin.length >= 2,
    av: indicators.av,
    downWeeks,
    weeksKnown: weeks.length > 0,
  });
  const board = readBoard({
    desk,
    spokes,
    gapBig,
    forceLabel: force.label,
    healed,
    panic,
    volumeHot,
  });

  const steps: ReadStep[] = [
    {
      title: "龙哥先止血",
      state: panic ? "waiting" : lineBack && healed ? "met" : healed ? "partial" : "waiting",
      evidence: emotion
        ? `上涨 ${emotion.up}，下跌 ${emotion.down}，涨停 ${emotion.limitUp ?? "未知"}，跌停 ${emotion.limitDown ?? "未知"}`
        : "全市场涨跌没有取到",
    },
    {
      title: "别硬拉科技",
      state: techQuiet ? "met" : sh.pct != null && cyb.pct != null && cyb.pct > sh.pct + 0.8 ? "waiting" : "partial",
      evidence:
        sh.pct != null && cyb.pct != null
          ? `上证 ${fmtPct(sh.pct)}，创业板 ${fmtPct(cyb.pct)}`
          : "指数对照没有取到",
    },
    {
      title: "钱从科技流向别处",
      state: techQuiet && !brokersWeak ? "met" : techQuiet ? "partial" : "waiting",
      evidence: brokersWeak
        ? "权重没有被创业板抢走，但证券这个气氛组还是弱的"
        : "证券跟着转强，非科技这边有响应",
    },
    {
      title: "非科技带指数止跌",
      state: !belowLine && aboveLow && healed ? "met" : healed && aboveLow ? "partial" : "waiting",
      evidence: belowLine
        ? `上证还在 3800 下方${nearLow != null ? `，离近 20 日低点 ${fmt(nearLow, 1)}%` : ""}。${clock.shape === "V" ? "形状是 V。" : clock.shape === "U" ? "形状更接近 U。" : "还在磨。"}`
        : "上证已回到 3800 之上",
    },
    {
      title: "杠杆哥进场",
      state: marginStopped && (lastNet?.netYi ?? 0) > 0 ? "met" : marginStreak > 0 ? "waiting" : "partial",
      evidence: margin.length ? `融资余额连撤 ${marginStreak} 天` : "融资余额没有取到",
    },
    {
      title: "反弹有没有钱维持",
      state: volumeHot && marginStopped ? "met" : volumeHot || marginStopped ? "partial" : "waiting",
      evidence: `成交 ${indicators.av != null ? `${fmt(indicators.av)} 万亿` : "未知"}，期货贴水 ${fmt(indicators.bs, 0)} 点`,
    },
  ];

  const metCount = checks.filter((item) => item.met).length;
  const limitsKnown = emotion != null && emotion.limitDown != null && emotion.limitUp != null;
  const quotesKnown = sh.price != null && hs300.price != null && cyb.price != null;
  const decisionReady = Boolean(emotion) && limitsKnown && quotesKnown;
  let headline = "数字不齐，先不把今天说死。";
  if (panic) {
    headline = "跌停还堆着，恐慌没过去。这个位置谈市场底太早。";
  } else if (!decisionReady) {
    headline = "数字不齐，先不把今天说死。";
  } else if (metCount >= 4) {
    headline = "右侧要看的几件事大多转过来了。即便如此，也还是底仓的思路，不是梭哈。";
  } else if (healed) {
    headline = "护盘把恐慌按住了，市场底还在磨。可以试多，右侧还没有。";
  } else {
    headline = "上涨家数还没压过下跌，止跌流程没有走完。";
  }

  const phase = panic
    ? "恐慌未散"
    : !decisionReady
      ? "先看原文"
      : metCount >= 4
        ? "右侧靠近"
        : healed
          ? "市场底还在磨"
          : "止跌没走完";
  const phaseNote = !decisionReady
    ? "关键行情或跌停没有对齐，先不把这一天说成右侧或试多。"
    : panic
      ? "跌停还多，这是恐慌，不是磨底。护盘底都还谈不上。"
      : healed
        ? "护盘底看的是跌停有没有蔓延、指数有没有失控。这一层大致按住了。市场底要市场自己磨出来，最好是 U 不是 V，而且非科技来带。时间不够的时候，他们不把试多说成右侧。"
        : "上涨家数还没压过下跌。他们写过，这种日子谈止跌太早，大手买也只是跌得慢一点。";
  const position = !decisionReady
    ? !quotesKnown
      ? "指数行情没有对齐，暂不可判断。"
      : "涨跌家数或跌停没有取全，暂不可判断。"
    : metCount >= 4
      ? "右侧齐了，仍然按底仓做，不是梭哈。看对只是一半，仓位重了、成本高了、耗太久，一样会被洗出去。"
      : healed
        ? "可以试多。试多是底仓：长线不空仓，也不重仓，看周线，跌到前一个平台再加一点。看对只是一半。"
        : "右侧没齐。观望，或者只留手里的仓位，都是他们写过的做法。别用一两根日线把仓位打满。";

  const detail = [
    emotion
      ? `全市场上涨 ${emotion.up} 家、下跌 ${emotion.down} 家、跌停 ${emotion.limitDown ?? "未知"} 家。复盘里把跌停只有十来家，看成恐慌没有蔓延。`
      : "",
    belowLine
      ? `上证收在 ${fmt(sh.price, 0)}，仍低于他们写了一年多的 3800 护盘线。`
      : sh.price != null
        ? `上证收在 ${fmt(sh.price, 0)}，站回了 3800。`
        : "",
    gapStyle != null
      ? `上证和创业板差 ${fmtSigned(gapStyle)} 个点，${gapWords(gapStyle)}。创业板更弱时，他们不把它看成科技抢风头。`
      : "",
    gapBig != null
      ? `沪深300和国证2000差 ${fmtSigned(gapBig)} 个点，${gapWords(gapBig)}。原话比的是沪深300和中证2000，中证2000这条行情没有取到，小票一端用国证2000代替。`
      : "",
    gapForeign != null && Math.abs(gapForeign) >= 0.5
      ? `上证和恒生科技差 ${fmtSigned(gapForeign)} 个点。他们把上证当内资、恒生科技当外资，差大了，单边就不容易持续。`
      : "",
    brokers?.pct != null
      ? `证券公司 ${fmtPct(brokers.pct)}。气氛组平时可以不动，止跌和转折时他们要涨多跌少。指数这一项${brokers.pct > 0 ? "转强了" : "还不及格"}。`
      : "",
    marginStreak > 0
      ? `融资余额已连撤 ${marginStreak} 个交易日。杠杆哥还在走，大涨那一段还没开始。`
      : margin.length
        ? "融资余额这几天没有继续往下撤。"
        : "",
    indicators.bs != null
      ? `现货比沪深加权期货高 ${fmt(indicators.bs, 0)} 点，贴水很深。旧的 ±5 点色带已经分不出程度，不能把它看成右侧。`
      : "",
    downWeeks > 0 ? `上证周线连跌 ${downWeeks} 周。他们反复说，别用一两根日线给一周定性。` : "",
  ]
    .filter(Boolean)
    .join("");

  return {
    headline,
    detail,
    phase,
    phaseNote,
    position,
    clock,
    force,
    spokes,
    board,
    steps,
    checks,
    weeks,
    gapBig,
    gapStyle,
    gapForeign,
    marginStreak,
    nearLow,
  };
}
