export type ZoneKey = "bs" | "uc" | "hk" | "av" | "cn10";
export type ZoneTone = "red" | "orange" | "green" | "ink";

export const INDICATORS: Record<
  ZoneKey,
  {
    abbr: string;
    name: string;
    unit: string;
    hint: string;
    lo: number;
    hi: number;
    colors: [ZoneTone, ZoneTone, ZoneTone];
    digits: number;
  }
> = {
  bs: {
    abbr: "bs",
    name: "基差",
    unit: "点",
    hint: "沪深300现货减去沪深加权期货。低于 -5 红区，-5 到 5 橙区，高于 5 绿区。",
    lo: -5,
    hi: 5,
    colors: ["red", "orange", "green"],
    digits: 2,
  },
  uc: {
    abbr: "uc",
    name: "离岸人民币",
    unit: "",
    hint: "美元兑离岸人民币。低于 7 红区，7 到 7.1 橙区，高于 7.1 绿区。",
    lo: 7,
    hi: 7.1,
    colors: ["red", "orange", "green"],
    digits: 4,
  },
  hk: {
    abbr: "hk",
    name: "恒生科技",
    unit: "%",
    hint: "恒生科技涨跌幅。低于 -1.5% 绿区，-1.5% 到 1% 橙区，高于 1% 红区。",
    lo: -1.5,
    hi: 1,
    colors: ["green", "orange", "red"],
    digits: 2,
  },
  av: {
    abbr: "av",
    name: "沪深成交",
    unit: "万亿",
    hint: "上证成交额加深证 A 指成交额，单位万亿。原浮动窗三档都用深色。",
    lo: 1,
    hi: 2,
    colors: ["ink", "ink", "ink"],
    digits: 2,
  },
  cn10: {
    abbr: "cn10",
    name: "十年国债",
    unit: "%",
    hint: "十年国债 ETF 涨跌幅。低于 -0.01% 红区，区间内橙区，高于 0.01% 绿区。",
    lo: -0.01,
    hi: 0.01,
    colors: ["red", "orange", "green"],
    digits: 3,
  },
};

export const ZONE_ORDER: ZoneKey[] = ["bs", "uc", "hk", "cn10", "av"];

export function toneOf(key: ZoneKey, value: number | null): ZoneTone {
  if (value == null || !Number.isFinite(value)) return "ink";
  const zone = INDICATORS[key];
  if (value < zone.lo) return zone.colors[0];
  if (value < zone.hi) return zone.colors[1];
  return zone.colors[2];
}

export function toneClass(tone: ZoneTone): string {
  if (tone === "red") return "text-up";
  if (tone === "orange") return "text-warn";
  if (tone === "green") return "text-down";
  return "text-paper";
}

export function toneLabel(tone: ZoneTone): string {
  if (tone === "red") return "红区";
  if (tone === "orange") return "橙区";
  if (tone === "green") return "绿区";
  return "深色";
}

export type Phase = "auction" | "morning" | "lunch" | "afternoon" | "closed" | "weekend";

const WEEKDAY: Record<string, string> = {
  Sun: "日",
  Mon: "一",
  Tue: "二",
  Wed: "三",
  Thu: "四",
  Fri: "五",
  Sat: "六",
};

export function shanghaiParts(now = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(now)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  if (map.hour === "24") map.hour = "00";
  return map;
}

export function marketPhase(now = new Date()): { phase: Phase; label: string } {
  const parts = shanghaiParts(now);
  const weekday = parts.weekday ?? "";
  if (weekday === "Sat" || weekday === "Sun") return { phase: "weekend", label: "周末休市" };
  const mins = Number(parts.hour) * 60 + Number(parts.minute);
  if (mins >= 9 * 60 + 15 && mins < 9 * 60 + 30) return { phase: "auction", label: "集合竞价" };
  if (mins >= 9 * 60 + 30 && mins < 11 * 60 + 30) return { phase: "morning", label: "上午交易" };
  if (mins >= 11 * 60 + 30 && mins < 13 * 60) return { phase: "lunch", label: "午间休市" };
  if (mins >= 13 * 60 && mins < 15 * 60) return { phase: "afternoon", label: "下午交易" };
  return { phase: "closed", label: "已收盘" };
}

export function clockLabel(now = new Date()): string {
  const parts = shanghaiParts(now);
  const weekday = WEEKDAY[parts.weekday ?? ""] ?? "";
  return `${parts.month}.${parts.day} 周${weekday} ${parts.hour}:${parts.minute}:${parts.second}`;
}
