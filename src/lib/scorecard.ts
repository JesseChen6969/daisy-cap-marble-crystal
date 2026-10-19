import { fmtPct } from "./format";
import type { Desk, TapePoint } from "./market.types";
import { readMarket } from "./reading";
import { shanghaiParts } from "./zones";

export const PATH_MODEL = "path-v1";
export const LIVE_MODEL = "six-v1";

export type Dim = {
  label: string;
  score: number;
  max: number;
  note: string;
};

export type Arm = {
  key: string;
  label: string;
  score: number;
  max: number;
  note: string;
};

export type ScoreDay = {
  date: string;
  rate: number | null;
  force: number | null;
  sh: number | null;
  alla: number | null;
  hs300: number | null;
  small: number | null;
  cyb: number | null;
  kc: number | null;
  vol: number | null;
  up: boolean;
  mark: "买" | "卖" | null;
};

export type Scorecard = {
  points: number;
  max: number;
  rate: number;
  band: string;
  dims: Dim[];
  arms: Arm[];
  forceSum: number;
  forceMax: number;
  forceRate: number;
  pattern: string;
  patternNote: string;
  heat: string;
  quiet: string;
  gs: number;
  hs: number;
  zone: string;
  effectWord: string;
  active: number | null;
  teamMove: string;
  hkFlow: string;
  bfi: string;
  mood: number | null;
  moodWord: string;
  yestGreed: number | null;
  yestWord: string;
  retailDelta: number | null;
  retailWord: string;
  longPct: number | null;
  shortPct: number | null;
  positionNote: string;
  risk: "triggered" | "clear" | "unknown";
  model: string;
  seriesModel: string;
  mainName: string;
  mainPct: number | null;
  mainShare: number | null;
  kill: string;
  series: ScoreDay[];
  limitUp: number | null;
  headline: string;
};

const FULL = 107;

function clamp(n: number, max: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(max, n)) * 100) / 100;
}

export function paceVolume(
  av: number | null,
  quote: { date: string; time: string },
  now = new Date(),
): { value: number | null; early: boolean; note: string } {
  if (av == null) return { value: null, early: false, note: "成交没有取到" };
  const parts = shanghaiParts(now);
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const date = quote.date.slice(0, 10);
  const [hour = "0", minute = "0"] = quote.time.split(":");
  const mins = Number(hour) * 60 + Number(minute);
  const inSession = date === today && mins >= 9 * 60 + 30 && mins < 15 * 60;
  if (!inSession) return { value: av, early: false, note: `两市成交 ${av.toFixed(2)} 万亿` };
  let elapsed = 0;
  if (mins >= 13 * 60) elapsed = 120 + Math.min(120, mins - 13 * 60);
  else if (mins >= 11 * 60 + 30) elapsed = 120;
  else elapsed = mins - (9 * 60 + 30);
  if (elapsed < 25) return { value: null, early: true, note: "开盘不久，成交还不作缩量判断" };
  const pace = Math.round(av * (240 / elapsed) * 100) / 100;
  return { value: pace, early: false, note: `盘中折全日约 ${pace.toFixed(2)} 万亿，已成交 ${av.toFixed(2)}` };
}

function clamp100(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(100, n)) * 10) / 10;
}

function ladderPct(desk: Desk, needle: string): number | null {
  return desk.ladder.find((item) => item.name.includes(needle))?.pct ?? null;
}

function pathReady(point: TapePoint): boolean {
  return point.sh != null && point.hs300 != null && point.small != null && point.cyb != null;
}

function pathScore(point: TapePoint): { rate: number | null; force: number | null } {
  if (!pathReady(point)) return { rate: null, force: null };
  const sh = point.sh ?? 0;
  const hs = point.hs300 ?? 0;
  const sm = point.small ?? 0;
  const cy = point.cyb ?? 0;
  const gap = hs - sm;
  const rate = clamp100(48 + sh * 7 + hs * 4 - Math.abs(gap) * 6 + (cy < -1 ? -6 : cy > 1 ? 4 : 0));
  const force = clamp100(52 + gap * 9 + (sh > -0.3 ? 5 : -6) + (point.alla == null ? 0 : point.alla * 3));
  return { rate, force };
}

function volumeTone(tape: TapePoint[]): string | null {
  const vols = tape.map((point) => point.vol).filter((n): n is number => n != null && n > 0);
  if (vols.length < 8) return null;
  const last = vols[vols.length - 1];
  const prior = vols.slice(-21, -1);
  if (last == null || prior.length < 5) return null;
  const avg = prior.reduce((sum, n) => sum + n, 0) / prior.length;
  if (last >= avg * 1.08) return "放量";
  if (last <= avg * 0.92) return "缩量";
  return "平量";
}

function buildSeries(tape: TapePoint[]): ScoreDay[] {
  const rows: ScoreDay[] = tape.map((point) => {
    const path = pathScore(point);
    return {
      date: point.date,
      rate: path.rate,
      force: path.force,
      sh: point.sh,
      alla: point.alla,
      hs300: point.hs300,
      small: point.small,
      cyb: point.cyb,
      kc: point.kc,
      vol: point.vol,
      up: (point.sh ?? 0) >= 0,
      mark: null,
    };
  });
  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (!prev || !curr) continue;
    if (prev.rate == null || curr.rate == null) continue;
    if (prev.rate < 40 && curr.rate >= 40) curr.mark = "买";
    else if (prev.rate >= 55 && curr.rate <= prev.rate - 6) curr.mark = "卖";
  }
  return rows;
}

export function scoreDesk(desk: Desk): Scorecard {
  const reading = readMarket(desk);
  const { sh, cyb, hs300, hstech, indicators, brokers } = desk;
  const quoteDate = (sh.date || hs300.date || "").slice(0, 10);
  const emotion =
    desk.emotion && desk.emotion.date && (!quoteDate || desk.emotion.date === quoteDate) ? desk.emotion : null;
  const a50 = ladderPct(desk, "50");
  const gz = ladderPct(desk, "2000");
  const gap = hs300.pct != null && gz != null ? hs300.pct - gz : null;
  const up = emotion?.up ?? 0;
  const down = emotion?.down ?? 0;
  const known = emotion != null && up + down > 0;
  const limitsKnown = emotion != null && emotion.limitUp != null && emotion.limitDown != null;
  const quotesKnown = sh.price != null && hs300.price != null && cyb.price != null;
  const limitDown = emotion?.limitDown ?? null;
  const limitUp = emotion?.limitUp ?? null;
  const ratio = known ? up / (up + down) : 0;
  const panic = limitDown != null && limitDown >= 40;
  const healed = known && limitDown != null && limitDown <= 15 && up > down;
  const forceLabel = reading.force.label;

  let effect = known ? ratio * 10 : 0;
  if (known && limitUp != null) effect += Math.min(4, limitUp / 25);
  if (panic) effect = Math.min(effect, 3);
  else if (healed) effect += 1.5;

  let structure = 6;
  const seq = [a50, hs300.pct, ladderPct(desk, "500"), ladderPct(desk, "1000"), gz].filter(
    (n): n is number => n != null,
  );
  if (seq.length >= 3) {
    const orderly = seq.every((n, i) => i === 0 || n <= seq[i - 1] + 0.35);
    if (orderly) structure += 8;
    if (seq[0] >= -0.3) structure += 4;
    if ((cyb.pct ?? 0) > (sh.pct ?? 0) + 0.6 && (a50 ?? 0) < 0) structure -= 6;
  }

  let line = 4;
  if (sh.price != null) {
    if (sh.price >= 3800) line += 12;
    else if (sh.price >= 3750) line += 6;
    else line += 2;
  }
  if (healed) line += 4;
  if (panic) line = Math.min(line, 4);

  const paced = paceVolume(indicators.av, { date: sh.date || hs300.date, time: sh.time || hs300.time });
  let volume = paced.early ? 8 : 4;
  if (paced.value != null) {
    if (paced.value >= 1 && paced.value <= 2) volume = 8 + (paced.value - 1) * 4;
    else if (paced.value > 2) volume = 13;
    else volume = 3;
  }

  let leverage = 8;
  if (desk.margin.length >= 2) {
    leverage = 12 - reading.marginStreak * 1.8;
    const last = desk.margin[desk.margin.length - 1];
    if (last && last.netYi > 0) leverage += 2;
  } else leverage = 0;

  let week = 16;
  const weeks = reading.weeks;
  let downWeeks = 0;
  for (let i = weeks.length - 1; i >= 0; i -= 1) {
    if ((weeks[i]?.ret ?? 0) >= 0) break;
    downWeeks += 1;
  }
  if (weeks.length) week = Math.max(2, 18 - downWeeks * 4);
  else week = 0;

  const dims: Dim[] = [
    { label: "赚钱效应", score: clamp(effect, 15), max: 15, note: known ? `上涨 ${up} / 下跌 ${down}` : "涨跌家数没有取到" },
    { label: "梯队结构", score: clamp(structure, 20), max: 20, note: "止跌顺序：上证50 → 沪深300 → 中证500 → 中证1000 → 国证2000" },
    { label: "护盘位置", score: clamp(line, 22), max: 22, note: sh.price != null ? `上证 ${sh.price.toFixed(0)}，3800 为护盘线` : "上证没有取到" },
    { label: "量能", score: clamp(volume, 15), max: 15, note: paced.note },
    { label: "杠杆", score: clamp(leverage, 15), max: 15, note: desk.margin.length ? `融资余额连降 ${reading.marginStreak} 天` : "融资没有取到" },
    { label: "周线", score: clamp(week, 20), max: 20, note: weeks.length ? `上证周线连跌 ${downWeeks} 周` : "周线没有取到" },
  ];
  const points = Math.round(dims.reduce((sum, dim) => sum + dim.score, 0) * 100) / 100;
  const rate = Math.round((points / FULL) * 10000) / 100;

  let band = "观望";
  if (!known || !limitsKnown || !quotesKnown) band = "数据不足";
  else if (panic) band = "回避";
  else if (rate >= 60) band = "做多";
  else if (rate >= 40) band = "一般";

  const inst = 10 + (gap ?? 0) * 5 + ((hs300.pct ?? 0) > 0.8 ? 4 : 0) + ((hs300.pct ?? 0) < -1 ? -6 : 0);
  let team = 4;
  if (limitDown != null && limitDown <= 15) team += 6;
  if (limitDown != null && limitDown >= 40) team -= 6;
  if ((a50 ?? -1) >= -0.3) team += 4;
  if (sh.price != null && sh.price >= 3800) team += 10;
  else if (sh.price != null && sh.price >= 3750) team += 2;
  if (forceLabel === "小维护") team += 3;
  if (forceLabel === "像一起拉") team += 6;
  const foreign = hstech.pct == null ? 0 : 6 + hstech.pct * 2.5;
  let retail = known ? ratio * 22 : 0;
  if (limitUp != null && limitUp >= 80) retail += 5;
  if (limitDown != null && limitDown >= 40) retail = Math.min(retail, 8);
  let hot = limitUp != null ? Math.min(14, limitUp / 6) : 0;
  if ((cyb.pct ?? 0) > 0.6) hot += 5;
  if ((brokers?.pct ?? -1) > 0) hot += 4;
  if ((cyb.pct ?? 0) < -0.3) hot -= 3;

  const arms: Arm[] = [
    { key: "机构", label: "机构", score: clamp(inst, 25), max: 25, note: gap != null ? `沪深300 − 国证2000 ${gap.toFixed(2)}` : "大小票没有对齐" },
    { key: "国家队", label: "国家队", score: clamp(team, 30), max: 30, note: forceLabel },
    { key: "外资", label: "外资", score: clamp(foreign, 15), max: 15, note: hstech.pct != null ? `恒生科技 ${fmtPct(hstech.pct)}` : "恒生科技没有取到" },
    { key: "散户", label: "散户", score: clamp(retail, 31), max: 31, note: known ? `上涨占比 ${(ratio * 100).toFixed(1)}%` : "涨跌家数没有取到" },
    { key: "游资", label: "游资", score: clamp(hot, 25), max: 25, note: limitUp != null ? `涨停 ${limitUp}` : "涨停家数没有取到" },
  ];
  const best = arms.reduce((top, arm) => (arm.score / arm.max > top.score / top.max ? arm : top), arms[0]!);
  if (best.score / best.max >= 0.72) best.label = `${best.key}主导`;

  const forceSum = Math.round(arms.reduce((sum, arm) => sum + arm.score, 0) * 100) / 100;
  const forceMax = arms.reduce((sum, arm) => sum + arm.max, 0);
  const forceRate = Math.round((forceSum / forceMax) * 10000) / 100;

  let pattern = "磨底市";
  if (panic) pattern = "恐慌市";
  else if (forceLabel === "小维护" || forceLabel === "像一起拉") pattern = "护盘市";
  else if (forceLabel === "结构不对") pattern = "错位市";

  const patternNote = panic
    ? "跌停在扩散"
    : healed
      ? "急跌不恐慌，等右侧信号"
      : "右侧信号还没有";

  let heat = "一般";
  if (panic) heat = "短期冰点";
  else if (limitUp != null && limitUp >= 90 && ratio > 0.65) heat = "过热";
  else if (healed && (indicators.av == null || indicators.av < 2)) heat = "不热";

  const quiet =
    sh.pct != null && cyb.pct != null && Math.abs(sh.pct) < 0.8 && Math.abs(cyb.pct) < 1.2 ? "安静" : "有波动";

  let gs = 0;
  if (limitUp != null && limitUp >= 80) gs += 4;
  if (ratio > 0.67) gs += 3;
  if ((indicators.av != null && !paced.early && (paced.value ?? 0) >= 2.2)) gs += 2;
  if ((cyb.pct ?? 0) > 2) gs += 3;
  if (panic) gs = 0;
  gs = clamp(gs, 10);

  let hsScore = 0;
  if (healed) hsScore += 4;
  if ((a50 ?? -1) >= -0.3) hsScore += 3;
  if (forceLabel === "小维护" || forceLabel === "像一起拉") hsScore += 2;
  if ((sh.pct ?? -1) > -0.5) hsScore += 1;
  hsScore = clamp(hsScore, 10);

  let zone = "正常区";
  if (gs >= 7) zone = "过热区";
  else if (hsScore >= 7 && gs < 4) zone = "护盘区";
  else if (panic) zone = "冰点区";

  const effectScore = dims[0]?.score ?? 0;
  const effectWord = effectScore >= 10.5 ? "偏强" : effectScore >= 6.5 ? "一般" : "偏弱";

  const active = known ? ((up - down) / (up + down)) * 100 : null;

  let teamMove = "看不出方向";
  if (forceLabel === "像一起拉") teamMove = "宽基一起转强";
  else if (forceLabel === "小维护") teamMove = "小维护，不是大救市";
  else if (reading.marginStreak >= 3 && sh.price != null && sh.price < 3800) teamMove = "余额连降 / 中长期还在撤";
  else if (forceLabel === "结构不对") teamMove = "权重没站住";

  let hkFlow = "恒生科技没有取到";
  if (hstech.pct != null) {
    const n = fmtPct(hstech.pct);
    if (hstech.pct > 1) hkFlow = `偏松 · 恒生科技 ${n}`;
    else if (hstech.pct < -1) hkFlow = `偏紧 · 恒生科技 ${n}`;
    else hkFlow = `组合中性 · 恒生科技 ${n}`;
  }

  let bfi = "大小票没有对齐";
  if (gap != null) {
    const n = `沪深300−国证2000 ${gap.toFixed(2)}`;
    if (gap > 1) bfi = `吸血 · ${n}`;
    else if (gap < -1) bfi = `放血 · ${n}`;
    else bfi = `观察期 · ${n}`;
  }

  const mood = known ? Math.round(ratio * 1000) / 10 : null;
  let moodWord = "没有取到";
  if (mood != null) {
    if (mood >= 70) moodWord = "偏热";
    else if (mood >= 55) moodWord = "轻微警惕";
    else if (mood >= 40) moodWord = "中性";
    else if (mood >= 25) moodWord = "谨慎";
    else moodWord = "恐惧";
  }

  const liveDate = (desk.sh.date || "").slice(0, 10);
  const lastBar = desk.tape[desk.tape.length - 1];
  const yest = lastBar && lastBar.date === liveDate ? desk.tape[desk.tape.length - 2] : lastBar;
  const yestGreed = yest ? clamp100(50 + (yest.sh ?? 0) * 12 + (yest.small ?? 0) * 8) : null;
  let yestWord = "没有昨收";
  if (yestGreed != null) {
    if (yestGreed <= 20) yestWord = "极度恐惧";
    else if (yestGreed <= 35) yestWord = "恐惧";
    else if (yestGreed <= 55) yestWord = "中性";
    else yestWord = "乐观";
  }

  const retailArm = arms.find((arm) => arm.key === "散户");
  const retailDelta = known && retailArm ? Math.round((retailArm.score - 15.5) * 10) / 10 : null;
  const retailWord = !known
    ? "没有涨跌家数"
    : retailDelta == null
      ? "没有取到"
      : retailDelta >= 5
        ? "乐观"
        : retailDelta <= -5
          ? "悲观"
          : "平淡";

  const met = reading.checks.filter((item) => item.met).length;
  let longPct: number | null = null;
  let shortPct: number | null = null;
  let positionNote = "关键涨跌或跌停没有取到，暂不可判断";
  const risk: Scorecard["risk"] = !limitsKnown ? "unknown" : panic ? "triggered" : "clear";
  if (!known || !limitsKnown) {
    positionNote = "关键涨跌或跌停没有取到，暂不可判断";
  } else if (!quotesKnown) {
    positionNote = "上证、沪深300或创业板没有行情，暂不可判断";
  } else if (panic) {
    longPct = 0;
    shortPct = 0;
    positionNote = "冰点不抄";
  } else if (reading.phase === "右侧靠近" || (rate >= 60 && met >= 4)) {
    longPct = 30;
    shortPct = 10;
    positionNote = "右侧靠近了，仍不满仓";
  } else if (reading.phase === "市场底还在磨") {
    longPct = 15;
    shortPct = 0;
    positionNote = "试多底仓，短线不加";
  } else {
    longPct = 0;
    shortPct = 0;
    positionNote = "右侧没齐，先观望";
  }

  const lead = desk.boardLead;
  const heavy = desk.laggards.filter((row) => (row.pct ?? 0) <= -3).slice(0, 2);
  const tapeTone = indicators.av == null && !paced.early ? volumeTone(desk.tape) : null;
  const volWord = paced.early ? "开盘" : tapeTone ?? ((paced.value ?? indicators.av ?? 0) >= 1.7 ? "放量" : "缩量");
  const names = heavy.map((row) => `${row.name} ${fmtPct(row.pct)}`).join(" · ");
  const brokerBit = brokers?.pct == null ? "" : ` · 证券 ${fmtPct(brokers.pct)}`;
  const kill = paced.early
    ? `开盘不久，不把成交当成缩量${brokerBit}`
    : desk.laggards.length === 0
      ? `${volWord}，成分股跌幅没有取到${brokerBit}`
      : names
        ? `${volWord}杀权重 · ${names}${brokerBit}`
        : `${volWord}，权重里没有单日跌过 3% 的${brokerBit}`;

  return {
    points,
    max: FULL,
    rate,
    band,
    dims,
    arms,
    forceSum,
    forceMax,
    forceRate,
    pattern,
    patternNote,
    heat,
    quiet,
    gs,
    hs: hsScore,
    zone,
    effectWord,
    active,
    teamMove,
    hkFlow,
    bfi,
    mood,
    moodWord,
    yestGreed,
    yestWord,
    retailDelta,
    retailWord,
    longPct,
    shortPct,
    positionNote,
    risk,
    model: LIVE_MODEL,
    seriesModel: PATH_MODEL,
    mainName: lead?.name ?? "行业榜没有取到",
    mainPct: lead?.pct ?? null,
    mainShare: lead ? Math.round(lead.share * 10) / 10 : null,
    kill,
    series: buildSeries(desk.tape),
    limitUp,
    headline: reading.headline,
  };
}
