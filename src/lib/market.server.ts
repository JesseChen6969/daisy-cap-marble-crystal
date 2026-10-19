import type {
  ArchiveItem,
  ArchiveKind,
  ArchivePayload,
  ArchiveSource,
  AuthorNote,
  Bar,
  Breadth,
  BreadthPayload,
  ComponentRow,
  DayBasket,
  DayBrief,
  DayMarket,
  DayRef,
  DayBoard,
  DayStats,
  Desk,
  Emotion,
  Indicators,
  LadderQuote,
  MarginDay,
  Quote,
  TapePoint,
} from "./market.types";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

const SINA_LIST = [
  "sh000300",
  "sz399006",
  "sh000001",
  "sz399107",
  "sh511260",
  "rt_hkHSTECH",
  "fx_susdcnh",
  "sh000016",
  "sh000905",
  "sh000852",
  "sz399303",
  "sz399975",
].join(",");

type Cache<T> = { at: number; data: T };

let deskCache: Cache<Desk> | null = null;
let breadthCache: Cache<BreadthPayload> | null = null;
let componentCache: Cache<ComponentRow[]> | null = null;
let componentFlight: Promise<ComponentRow[]> | null = null;
let rssCache: Cache<ArchiveItem[]> | null = null;
let rssFlight: Promise<ArchiveItem[]> | null = null;
let reportCache: Cache<ArchiveItem[]> | null = null;
let reportFlight: Promise<ArchiveItem[]> | null = null;

let klineCache = new Map<string, Cache<Array<Bar & { volume: number | null }>>>();
const briefCache = new Map<string, Cache<DayBrief>>();
const KLINE_TTL = 20 * 60_000;
const BRIEF_TTL = 30 * 60_000;
const DESK_TTL = 12_000;
const BREADTH_TTL = 20_000;
const COMPONENT_TTL = 20_000;
const RSS_TTL = 10 * 60_000;
const REPORT_TTL = 30 * 60_000;
const DIRECT_REVIEWS = ["https://mp.weixin.qq.com/s/inX28XwEokfS6ZVX3IxQGw"];
const directNotes = new Map<string, { verdict: string; excerpt: string; amountWanYi: number | null }>();

function num(value: string | undefined): number | null {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function emptyQuote(code: string, name: string): Quote {
  return {
    code,
    name,
    price: null,
    change: null,
    pct: null,
    open: null,
    high: null,
    low: null,
    prev: null,
    amountYi: null,
    date: "",
    time: "",
  };
}

function emptyBreadth(): Breadth {
  return { tup: 0, tdn: 0, t5u: 0, t5d: 0, d50: 0, u05: 0, flat: 0, missing: 0, total: 0 };
}

function findStamp(parts: string[]): { date: string; time: string } {
  for (let i = 0; i < parts.length - 1; i += 1) {
    const date = parts[i] ?? "";
    const time = parts[i + 1] ?? "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}/.test(time)) return { date, time };
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(date) && /^\d{2}:\d{2}/.test(time)) {
      return { date: date.replace(/\//g, "-"), time };
    }
  }
  return { date: "", time: "" };
}

async function fetchBuffer(url: string, referer: string, ms = 9000): Promise<ArrayBuffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Referer: referer,
        Accept: "*/*",
      },
    });
    if (!res.ok) throw new Error(`上游 ${res.status}`);
    return await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

function decode(buf: ArrayBuffer, encoding: string): string {
  return new TextDecoder(encoding).decode(buf);
}

function parseSina(text: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  const re = /hq_str_([A-Za-z0-9_]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    out[match[1] ?? ""] = (match[2] ?? "").split(",");
  }
  return out;
}

function indexQuote(code: string, fallback: string, parts: string[] | undefined): Quote {
  if (!parts || parts.length < 6) return emptyQuote(code, fallback);
  const open = num(parts[1]);
  const prev = num(parts[2]);
  const price = num(parts[3]);
  const high = num(parts[4]);
  const low = num(parts[5]);
  const amount = num(parts[9]);
  const stamp = findStamp(parts);
  const change = price != null && prev != null ? price - prev : null;
  const pct = change != null && prev ? (change / prev) * 100 : null;
  return {
    code,
    name: parts[0] || fallback,
    price,
    change,
    pct,
    open,
    high,
    low,
    prev,
    amountYi: amount != null ? amount / 1e8 : null,
    date: stamp.date,
    time: stamp.time,
  };
}

function hstechQuote(parts: string[] | undefined): Quote {
  if (!parts || parts.length < 9) return emptyQuote("HSTECH", "恒生科技");
  const stamp = findStamp(parts);
  return {
    code: "HSTECH",
    name: parts[1] || "恒生科技",
    price: num(parts[6]),
    change: num(parts[7]),
    pct: num(parts[8]),
    open: num(parts[2]),
    high: num(parts[4]),
    low: num(parts[5]),
    prev: num(parts[3]),
    amountYi: null,
    date: stamp.date,
    time: stamp.time,
  };
}

function fxQuote(parts: string[] | undefined): Quote {
  if (!parts || parts.length < 9) return emptyQuote("USDCNH", "离岸人民币");
  const price = num(parts[8]) ?? num(parts[1]);
  const delta = num(parts[11]);
  const date = parts.find((part) => /^\d{4}-\d{2}-\d{2}$/.test(part)) ?? "";
  const time = parts[0] && /^\d{2}:\d{2}/.test(parts[0]) ? parts[0] : "";
  return {
    code: "USDCNH",
    name: "离岸人民币",
    price,
    change: delta,
    pct: price && delta != null ? (delta / price) * 100 : null,
    open: null,
    high: num(parts[14]),
    low: num(parts[15]),
    prev: null,
    amountYi: null,
    date,
    time,
  };
}

function parseFutures(text: string): { price: number; stamp: string } | null {
  const match = text.match(/"([^"]+)"/);
  if (!match?.[1]) return null;
  const parts = match[1].split(",");
  const price = num(parts[3]);
  if (price == null) return null;
  const stamp = findStamp(parts);
  return { price, stamp: stamp.date ? `${stamp.date} ${stamp.time}` : "" };
}

function summarize(rows: ComponentRow[]): Breadth {
  const breadth = emptyBreadth();
  breadth.total = rows.length;
  for (const row of rows) {
    if (row.pct == null) {
      breadth.missing += 1;
      continue;
    }
    if (row.pct > 0) breadth.tup += 1;
    else if (row.pct < 0) breadth.tdn += 1;
    else breadth.flat += 1;
    if (row.pct < -5) breadth.t5d += 1;
    else if (row.pct < 0) breadth.d50 += 1;
    else if (row.pct < 5) breadth.u05 += 1;
    else breadth.t5u += 1;
  }
  return breadth;
}

async function loadSina(): Promise<Record<string, string[]>> {
  const buf = await fetchBuffer(
    `https://hq.sinajs.cn/list=${SINA_LIST}`,
    "https://finance.sina.com.cn",
  );
  return parseSina(decode(buf, "gbk"));
}

async function loadFutures(): Promise<{ price: number; stamp: string } | null> {
  const buf = await fetchBuffer(
    `https://api.jijinhao.com/sQuoteCenter/realTime.htm?code=JO_338503&_=${Date.now()}`,
    "https://m.quheqihuo.com/",
  );
  return parseFutures(decode(buf, "utf-8"));
}

async function loadKline(symbol: string): Promise<Array<Bar & { volume: number | null }>> {
  const hit = klineCache.get(symbol);
  if (hit && Date.now() - hit.at < KLINE_TTL && hit.data.length > 0) return hit.data;
  let rows: Array<Bar & { volume: number | null }> = [];
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      rows = await loadKlineOnce(symbol);
      if (rows.length > 0) {
        klineCache.set(symbol, { at: Date.now(), data: rows });
        return rows;
      }
    } catch (error) {
      console.error("kline", symbol, error instanceof Error ? error.message : error);
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return rows;
}

async function loadKlineOnce(symbol: string): Promise<Array<Bar & { volume: number | null }>> {
  const buf = await fetchBuffer(
    `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=800`,
    "https://finance.sina.com.cn",
    15000,
  );
  const text = decode(buf, "utf-8");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return [];
  const rows = JSON.parse(text.slice(start, end + 1)) as Array<Record<string, string>>;
  return rows
    .map((row) => ({
      date: row.day ?? "",
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }))
    .filter((row) => row.date && Number.isFinite(row.close))
    .map((row) => ({ ...row, volume: Number.isFinite(row.volume) ? row.volume : null }));
}

async function loadSeries(): Promise<{ hs300: Bar[]; sh: Bar[]; tape: TapePoint[] }> {
  const load = (symbol: string) => loadKline(symbol).catch(() => [] as Array<Bar & { volume: number | null }>);
  const symbols = ["sh000300", "sh000001", "sz399006", "sh000852", "sh000688", "sh000016", "sh000905", "sz399303", "sz399975", "sh511260"];
  const loaded: Array<Array<Bar & { volume: number | null }>> = [];
  for (let i = 0; i < symbols.length; i += 3) {
    const batch = await Promise.all(symbols.slice(i, i + 3).map((symbol) => load(symbol)));
    loaded.push(...batch);
  }
  const hstech = await loadTencentKline("hkHSTECH").catch(() => [] as Array<Bar & { volume: number | null }>);
  const fx = await loadFxDaily().catch(() => [] as Bar[]);
  const [hs300, sh, cyb, small, kc, a50, zz500, gz, brokers, bond] = loaded;
  return {
    hs300: hs300 ?? [],
    sh: sh ?? [],
    tape: alignTape({
      sh: sh ?? [],
      hs300: hs300 ?? [],
      cyb: cyb ?? [],
      small: small ?? [],
      kc: kc ?? [],
      a50: a50 ?? [],
      zz500: zz500 ?? [],
      gz: gz ?? [],
      brokers: brokers ?? [],
      bond: bond ?? [],
      hstech,
      fx,
    }),
  };
}

async function loadTencentKline(symbol: string): Promise<Array<Bar & { volume: number | null }>> {
  const key = `qq:${symbol}`;
  const hit = klineCache.get(key);
  if (hit && Date.now() - hit.at < KLINE_TTL && hit.data.length > 0) return hit.data;
  const urls = [
    `https://web.ifzq.gtimg.cn/appstock/app/kline/kline?param=${symbol},day,,,800,`,
    `https://proxy.finance.qq.com/ifzqgtimg/appstock/app/newfqkline/get?param=${symbol},day,,,800,qfq`,
  ];
  for (const url of urls) {
    try {
      const buf = await fetchBuffer(url, "https://gu.qq.com/", 15000);
      const json = JSON.parse(decode(buf, "utf-8")) as {
        data?: Record<string, { day?: string[][]; qfqday?: string[][] }>;
      };
      const node = json.data?.[symbol] ?? Object.values(json.data ?? {})[0];
      const rows = node?.qfqday?.length ? node.qfqday : (node?.day ?? []);
      const parsed = rows
        .map((row) => ({
          date: row[0] ?? "",
          open: Number(row[1]),
          close: Number(row[2]),
          high: Number(row[3]),
          low: Number(row[4]),
          volume: Number(row[5]),
        }))
        .filter((row) => row.date && Number.isFinite(row.close))
        .map((row) => ({ ...row, volume: Number.isFinite(row.volume) ? row.volume : null }));
      if (parsed.length > 100) {
        klineCache.set(key, { at: Date.now(), data: parsed });
        return parsed;
      }
    } catch (error) {
      console.error("tencent-kline", error instanceof Error ? error.message : error);
    }
  }
  return [];
}

function parseFxDaily(text: string): Bar[] {
  const start = text.indexOf('("');
  const end = text.lastIndexOf('")');
  if (start < 0 || end <= start) return [];
  const rows: Bar[] = [];
  for (const part of text.slice(start + 2, end).split("|")) {
    const cols = part
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item !== "");
    const date = cols[0] ?? "";
    const open = Number(cols[1]);
    const low = Number(cols[2]);
    const high = Number(cols[3]);
    const close = Number(cols[4]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(close)) continue;
    rows.push({
      date,
      open: Number.isFinite(open) ? open : close,
      high: Number.isFinite(high) ? high : close,
      low: Number.isFinite(low) ? low : close,
      close,
    });
  }
  return rows;
}

async function loadFxDaily(): Promise<Bar[]> {
  const key = "fx:USDCNH";
  const hit = klineCache.get(key);
  if (hit && Date.now() - hit.at < KLINE_TTL && hit.data.length > 0) return hit.data;
  try {
    const buf = await fetchBuffer(
      "https://vip.stock.finance.sina.com.cn/forex/api/jsonp.php/var%20fx=/NewForexService.getDayKLine?symbol=fx_susdcnh",
      "https://finance.sina.com.cn/money/forex/",
      15000,
    );
    const rows = parseFxDaily(decode(buf, "utf-8")).map((bar) => ({ ...bar, volume: null as number | null }));
    if (rows.length > 0) klineCache.set(key, { at: Date.now(), data: rows });
    return rows;
  } catch (error) {
    console.error("fx-daily", error instanceof Error ? error.message : error);
    return [];
  }
}

function dailyPct(bars: Bar[]): Map<string, number> {
  const out = new Map<string, number>();
  for (let i = 1; i < bars.length; i += 1) {
    const prev = bars[i - 1]?.close;
    const curr = bars[i];
    if (!curr || !prev) continue;
    out.set(curr.date, ((curr.close - prev) / prev) * 100);
  }
  return out;
}

function alignTape(input: {
  sh: Array<Bar & { volume: number | null }>;
  hs300: Bar[];
  cyb: Bar[];
  small: Bar[];
  kc: Bar[];
  a50: Bar[];
  zz500: Bar[];
  gz: Bar[];
  brokers: Bar[];
  bond: Bar[];
  hstech: Bar[];
  fx: Bar[];
}): TapePoint[] {
  const pct = {
    sh: dailyPct(input.sh),
    hs300: dailyPct(input.hs300),
    cyb: dailyPct(input.cyb),
    small: dailyPct(input.small),
    kc: dailyPct(input.kc),
    a50: dailyPct(input.a50),
    zz500: dailyPct(input.zz500),
    gz: dailyPct(input.gz),
    brokers: dailyPct(input.brokers),
    bond: dailyPct(input.bond),
    hstech: dailyPct(input.hstech),
    fx: dailyPct(input.fx),
  };
  const closes = {
    sh: new Map(input.sh.map((bar) => [bar.date, bar.close])),
    hs300: new Map(input.hs300.map((bar) => [bar.date, bar.close])),
    cyb: new Map(input.cyb.map((bar) => [bar.date, bar.close])),
    bond: new Map(input.bond.map((bar) => [bar.date, bar.close])),
    hstech: new Map(input.hstech.map((bar) => [bar.date, bar.close])),
    fx: new Map(input.fx.map((bar) => [bar.date, bar.close])),
  };
  const vol = new Map<string, number>();
  for (const bar of input.sh) {
    if (bar.volume != null) vol.set(bar.date, bar.volume / 1e10);
  }
  return input.sh.slice(1).map((bar) => {
    const date = bar.date;
    const hs300 = pct.hs300.get(date) ?? null;
    const small = pct.small.get(date) ?? null;
    const alla = hs300 != null && small != null ? (hs300 + small) / 2 : (hs300 ?? small);
    return {
      date,
      sh: pct.sh.get(date) ?? null,
      hs300,
      cyb: pct.cyb.get(date) ?? null,
      small,
      kc: pct.kc.get(date) ?? null,
      alla,
      vol: vol.get(date) ?? null,
      shClose: closes.sh.get(date) ?? null,
      hs300Close: closes.hs300.get(date) ?? null,
      cybClose: closes.cyb.get(date) ?? null,
      a50: pct.a50.get(date) ?? null,
      zz500: pct.zz500.get(date) ?? null,
      gz: pct.gz.get(date) ?? null,
      brokers: pct.brokers.get(date) ?? null,
      hstech: pct.hstech.get(date) ?? null,
      hstechClose: closes.hstech.get(date) ?? null,
      bond: pct.bond.get(date) ?? null,
      bondClose: closes.bond.get(date) ?? null,
      fx: pct.fx.get(date) ?? null,
      fxClose: closes.fx.get(date) ?? null,
    };
  });
}

async function loadHotBoard(): Promise<Desk["boardLead"]> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const lead = await loadHotBoardOnce();
      if (lead) return lead;
    } catch (error) {
      console.error("hot-board", error instanceof Error ? error.message : error);
    }
  }
  return null;
}

async function loadHotBoardOnce(): Promise<Desk["boardLead"]> {
  const buf = await fetchBuffer(
    "https://vip.stock.finance.sina.com.cn/q/view/newSinaHy.php",
    "https://finance.sina.com.cn/",
    12000,
  );
  const text = decode(buf, "gbk");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  const data = JSON.parse(text.slice(start, end + 1)) as Record<string, string>;
  const rows = Object.values(data)
    .map((line) => {
      const parts = line.split(",");
      return { name: (parts[1] ?? "").trim(), pct: Number(parts[5]) };
    })
    .filter((row) => row.name && Number.isFinite(row.pct))
    .sort((a, b) => b.pct - a.pct);
  const top = rows[0];
  if (!top) return null;
  const pos = rows.reduce((sum, row) => (row.pct > 0 ? sum + row.pct : sum), 0);
  return { name: top.name, pct: top.pct, share: pos > 0 ? (top.pct / pos) * 100 : 0 };
}

async function loadEmotion(): Promise<Emotion> {
  const buf = await fetchBuffer(
    "https://push2ex.eastmoney.com/getTopicZDFenBu?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt",
    "https://quote.eastmoney.com/",
  );
  const json = JSON.parse(decode(buf, "utf-8")) as {
    data?: { qdate?: number; fenbu?: Array<Record<string, number>> };
  };
  const buckets: Record<string, number> = {};
  for (const item of json.data?.fenbu ?? []) Object.assign(buckets, item);
  const value = (key: string) => buckets[key] ?? 0;
  const up = Object.entries(buckets).reduce((sum, [key, count]) => (Number(key) > 0 ? sum + count : sum), 0);
  const down = Object.entries(buckets).reduce((sum, [key, count]) => (Number(key) < 0 ? sum + count : sum), 0);
  const raw = String(json.data?.qdate ?? "");
  const date = raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}` : raw;
  return { date, up, down, flat: value("0"), limitUp: value("11"), limitDown: value("-11") };
}

async function loadMargin(): Promise<MarginDay[]> {
  const buf = await fetchBuffer(
    "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPTA_RZRQ_LSHJ&columns=DIM_DATE,RZYE,RZJME&pageSize=600&pageNumber=1&sortColumns=DIM_DATE&sortTypes=-1",
    "https://data.eastmoney.com/",
  );
  const json = JSON.parse(decode(buf, "utf-8")) as {
    result?: { data?: Array<{ DIM_DATE?: string; RZYE?: number; RZJME?: number }> };
  };
  return (json.result?.data ?? [])
    .map((row) => ({
      date: String(row.DIM_DATE ?? "").slice(0, 10),
      balanceYi: Number(row.RZYE) / 1e8,
      netYi: Number(row.RZJME) / 1e8,
    }))
    .filter((row) => row.date && Number.isFinite(row.balanceYi))
    .reverse();
}

async function loadAuthor(): Promise<AuthorNote | null> {
  const items = await loadRss();
  const review = items.find((item) => item.kind === "review");
  if (!review) return null;
  const parsed = await readReview(review.link);
  return {
    title: review.title,
    link: review.link,
    verdict: parsed.verdict,
    excerpt: parsed.excerpt,
  };
}

function unescapeHtml(value: string): string {
  return value
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function reviewText(html: string): { verdict: string; excerpt: string; amountWanYi: number | null } {
  const art = html.match(/<article[\s\S]*?<\/article>/i)?.[0] ?? html;
  const flat = unescapeHtml(art.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
  const summary = flat.match(/总结[:：]\s*(.{8,240}?)(?:今日市场|交易路漫漫|文章内容|投资有风险|微信公众号)/);
  const paragraphs = [...art.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => unescapeHtml(match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim())
    .filter((line) => line.length >= 16 && !/返回每日|文章内容仅为|投资建议|交易路漫漫|查找信息/.test(line));
  const loose =
    paragraphs.length > 0
      ? paragraphs
      : [(flat.split(/微信公众号原文|约\s*\d+\s*分钟/).pop() ?? "").split(/交易路漫漫|文章内容仅为/)[0] ?? ""].filter(
          (line) => line.trim().length > 20,
        );
  const verdict = (summary?.[1] ?? loose[0] ?? "").replace(/\s+/g, " ").trim().slice(0, 220);
  const excerpt = (summary?.[1] ?? loose.slice(0, 3).join("")).replace(/\s+/g, "").slice(0, 420);
  const amountMatch = `${verdict}${excerpt}`.match(/成交额?[^。]{0,18}?(\d+(?:\.\d+)?)\s*万亿/);
  const amount = amountMatch ? Number(amountMatch[1]) : Number.NaN;
  return {
    verdict,
    excerpt,
    amountWanYi: amount >= 0.4 && amount <= 8 ? amount : null,
  };
}

function dayOf(item: ArchiveItem): string | null {
  const link = item.link.match(/\/(20\d{2}-\d{2}-\d{2})-/)?.[1];
  if (link) return link;
  const title = item.title.match(/(20\d{2})[.](\d{1,2})[.](\d{1,2})/);
  if (!title) return null;
  return `${title[1]}-${title[2].padStart(2, "0")}-${title[3].padStart(2, "0")}`;
}

function toNotes(items: ArchiveItem[]): DayRef[] {
  const notes: DayRef[] = [];
  for (const item of items) {
    if (item.kind !== "review" && item.kind !== "intel") continue;
    const day = dayOf(item);
    if (!day || day < "2025-01-01") continue;
    notes.push({ day, title: item.title, link: item.link, kind: item.kind, tag: item.tag });
  }
  return notes;
}

export async function loadDayBrief(day: string): Promise<DayBrief> {
  const empty: DayBrief = { day, author: null, items: [], amountWanYi: null, stats: null, market: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return empty;
  const hit = briefCache.get(day);
  if (hit && Date.now() - hit.at < BRIEF_TTL) return hit.data;
  const statsPromise = loadDayStats(day);
  const marketPromise = loadDayMarket(day);
  let rss: ArchiveItem[] = [];
  try {
    rss = await loadRss();
  } catch (error) {
    console.error("day-brief-rss", error instanceof Error ? error.message : error);
  }
  const items = rss.filter((item) => dayOf(item) === day && (item.kind === "review" || item.kind === "intel"));
  const review = items.find((item) => item.kind === "review") ?? null;
  let author: AuthorNote | null = review ? { title: review.title, link: review.link, verdict: "", excerpt: "" } : null;
  let amountWanYi: number | null = null;
  if (review) {
    try {
      const parsed = await readReview(review.link);
      author = { title: review.title, link: review.link, verdict: parsed.verdict, excerpt: parsed.excerpt };
      amountWanYi = parsed.amountWanYi;
    } catch (error) {
      console.error("day-brief", error instanceof Error ? error.message : error);
    }
  }
  const [stats, market] = await Promise.all([statsPromise, marketPromise]);
  const payload: DayBrief = { day, author, items, amountWanYi, stats, market };
  if (market && stats && (!review || author?.verdict)) briefCache.set(day, { at: Date.now(), data: payload });
  return payload;
}

function boardRank(label: string, value: unknown): { height: number; days: number } {
  const packed = finiteNum(value);
  if (packed != null && packed >= 65536) return { height: Math.floor(packed / 65536), days: packed % 65536 };
  const days = Number(label.match(/(\d+)天/)?.[1] ?? 0);
  const height = Number(label.match(/(\d+)板/)?.[1] ?? 0);
  return { height, days };
}

function readBoards(rows: Array<{ name?: unknown; high_days?: unknown; high_days_value?: unknown }>): DayBoard[] {
  const boards: DayBoard[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const label = typeof row.high_days === "string" ? row.high_days.trim() : "";
    if (!name || !label || label === "首板" || seen.has(name)) continue;
    const rank = boardRank(label, row.high_days_value);
    if (rank.height < 2) continue;
    seen.add(name);
    boards.push({ name, label, height: rank.height });
  }
  boards.sort((a, b) => b.height - a.height || boardRank(a.label, null).days - boardRank(b.label, null).days || a.name.localeCompare(b.name, "zh"));
  return boards;
}

function finiteNum(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function compactDay(value: unknown): string {
  const hit = String(value ?? "").match(/(\d{8})/);
  return hit?.[1] ?? "";
}

async function loadDayStats(day: string): Promise<DayStats | null> {
  const compact = day.replace(/-/g, "");
  const referer = "https://data.10jqka.com.cn/datacenterph/limitupfront/";
  const field = "199112,330324,330329";
  const poolUrl = (page: number) =>
    `https://data.10jqka.com.cn/dataapi/limit_up/limit_up_pool?page=${page}&limit=200&field=${field}&filter=HS,GEM2STAR&order_field=330324&order_type=0&date=${compact}`;
  const [poolRes, blockRes, downRes] = await Promise.allSettled([
    fetchBuffer(poolUrl(1), referer, 12000),
    fetchBuffer(`https://data.10jqka.com.cn/dataapi/limit_up/block_top?filter=HS,GEM2STAR&date=${compact}`, referer, 15000),
    fetchBuffer(`https://data.10jqka.com.cn/dataapi/limit_up/lower_limit_pool?page=1&limit=5&date=${compact}`, referer, 12000),
  ]);
  if (poolRes.status !== "fulfilled") {
    console.error("limit-pool", poolRes.reason instanceof Error ? poolRes.reason.message : poolRes.reason);
    return null;
  }
  let pool: {
    data?: {
      date?: unknown;
      page?: { total?: unknown };
      info?: Array<{ name?: unknown; high_days?: unknown; high_days_value?: unknown }>;
      limit_up_count?: { today?: { num?: unknown; open_num?: unknown; rate?: unknown } };
      limit_down_count?: { today?: { num?: unknown } };
    };
  };
  try {
    pool = JSON.parse(decode(poolRes.value, "utf-8")) as typeof pool;
  } catch {
    return null;
  }
  if (compactDay(pool.data?.date) !== compact) return null;
  const info = [...(pool.data?.info ?? [])];
  const total = finiteNum(pool.data?.page?.total) ?? info.length;
  if (total > info.length) {
    try {
      const more = JSON.parse(decode(await fetchBuffer(poolUrl(2), referer, 12000), "utf-8")) as typeof pool;
      if (compactDay(more.data?.date) === compact && Array.isArray(more.data?.info)) info.push(...more.data.info);
    } catch (error) {
      console.error("limit-pool-page", error instanceof Error ? error.message : error);
    }
  }
  const limitUp = finiteNum(pool.data?.limit_up_count?.today?.num);
  const limitDown = finiteNum(pool.data?.limit_down_count?.today?.num);
  if (limitUp == null || limitDown == null) return null;
  const broken = finiteNum(pool.data?.limit_up_count?.today?.open_num) ?? 0;
  const seal = finiteNum(pool.data?.limit_up_count?.today?.rate);

  let mainName: string | null = null;
  let mainPct: number | null = null;
  let mainUps: number | null = null;
  let highBoard: string | null = null;
  if (blockRes.status === "fulfilled") {
    try {
      const block = JSON.parse(decode(blockRes.value, "utf-8")) as {
        data?: Array<{ name?: unknown; change?: unknown; limit_up_num?: unknown; high?: unknown }>;
      };
      const top = Array.isArray(block.data) ? block.data[0] : null;
      if (top && typeof top.name === "string" && top.name.trim()) {
        mainName = top.name.trim();
        mainPct = finiteNum(top.change);
        mainUps = finiteNum(top.limit_up_num);
        highBoard = typeof top.high === "string" && top.high.trim() ? top.high.trim() : null;
      }
    } catch (error) {
      console.error("block-top", error instanceof Error ? error.message : error);
    }
  } else {
    console.error("block-top", blockRes.reason instanceof Error ? blockRes.reason.message : blockRes.reason);
  }

  const downNames: string[] = [];
  if (downRes.status === "fulfilled") {
    try {
      const lower = JSON.parse(decode(downRes.value, "utf-8")) as {
        data?: { date?: unknown; info?: Array<{ name?: unknown }> };
      };
      if (compactDay(lower.data?.date) === compact && Array.isArray(lower.data?.info)) {
        for (const row of lower.data.info) {
          const name = typeof row?.name === "string" ? row.name.trim() : "";
          if (!name || downNames.includes(name)) continue;
          downNames.push(name);
          if (downNames.length >= 3) break;
        }
      }
    } catch (error) {
      console.error("limit-down", error instanceof Error ? error.message : error);
    }
  }
  return { limitUp, limitDown, broken, seal, highBoard, mainName, mainPct, mainUps, downNames, boards: readBoards(info) };
}

let memberCache: { at: number; data: Array<{ code: string; name: string }> } | null = null;
const basketCache = new Map<string, { at: number; data: DayBasket }>();
const MEMBER_TTL = 6 * 60 * 60_000;

function qqSymbol(code: string): string {
  if (code.startsWith("6") || code.startsWith("9")) return `sh${code}`;
  if (code.startsWith("4") || code.startsWith("8")) return `bj${code}`;
  return `sz${code}`;
}

async function mapPool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      out[index] = await fn(items[index]!);
    }
  });
  await Promise.all(workers);
  return out;
}

async function postForm(url: string, body: string, ms = 12000, userAgent = UA): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "User-Agent": userAgent,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "*/*",
      },
      body,
    });
    if (!res.ok) throw new Error(`上游 ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function loadHs300Members(): Promise<Array<{ code: string; name: string }>> {
  if (memberCache && Date.now() - memberCache.at < MEMBER_TTL && memberCache.data.length > 200) return memberCache.data;
  const buf = await fetchBuffer(
    "https://datacenter-web.eastmoney.com/api/data/v1/get?pageSize=500&pageNumber=1&reportName=RPT_INDEX_TS_COMPONENT&columns=SECURITY_CODE,SECURITY_NAME_ABBR&filter=(TYPE%3D%221%22)",
    "https://data.eastmoney.com/",
    12000,
  );
  const json = JSON.parse(decode(buf, "utf-8")) as {
    result?: { data?: Array<{ SECURITY_CODE?: string; SECURITY_NAME_ABBR?: string }> };
  };
  const rows = (json.result?.data ?? [])
    .map((row) => ({ code: String(row.SECURITY_CODE ?? ""), name: String(row.SECURITY_NAME_ABBR ?? "") }))
    .filter((row) => /^\d{6}$/.test(row.code));
  if (rows.length > 200) memberCache = { at: Date.now(), data: rows };
  return rows;
}

function barCount(): number {
  return 800;
}

type CloseBar = { date: string; close: number };

let closeCache: { at: number; names: Map<string, string>; bars: Map<string, CloseBar[]> } | null = null;
let closeFlight: Promise<{ names: Map<string, string>; bars: Map<string, CloseBar[]> }> | null = null;

async function loadOneCloses(code: string): Promise<CloseBar[] | null> {
  const symbol = qqSymbol(code);
  const buf = await fetchBuffer(
    `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=no&datalen=${barCount()}`,
    "https://finance.sina.com.cn",
    12000,
  );
  const text = decode(buf, "utf-8");
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return null;
  const rows = JSON.parse(text.slice(start, end + 1)) as Array<{ day?: string; close?: string }>;
  const out: CloseBar[] = [];
  for (const row of rows) {
    const close = Number(row.close);
    if (!row.day || !Number.isFinite(close)) continue;
    out.push({ date: row.day, close });
  }
  return out.length > 20 ? out : null;
}

async function loadConstituentSeries(): Promise<{ names: Map<string, string>; bars: Map<string, CloseBar[]> }> {
  if (closeCache && Date.now() - closeCache.at < MEMBER_TTL && closeCache.bars.size >= 240) {
    return { names: closeCache.names, bars: closeCache.bars };
  }
  if (closeFlight) return closeFlight;
  closeFlight = (async () => {
    const members = await loadHs300Members();
    if (members.length < 240) throw new Error("沪深300成分不够");
    const pull = (row: { code: string; name: string }) => loadOneCloses(row.code).catch(() => null);
    let series = await mapPool(members, 32, pull);
    const missed = members.filter((_, index) => (series[index]?.length ?? 0) <= 20);
    if (missed.length > 0 && missed.length < 120) {
      const again = await mapPool(missed, 8, pull);
      const byCode = new Map<string, CloseBar[]>();
      missed.forEach((row, index) => {
        const bars = again[index];
        if (bars && bars.length > 20) byCode.set(row.code, bars);
      });
      series = members.map((row, index) => (series[index] && series[index]!.length > 20 ? series[index] : (byCode.get(row.code) ?? null)));
    }
    const bars = new Map<string, CloseBar[]>();
    const names = new Map<string, string>();
    members.forEach((row, index) => {
      const one = series[index];
      if (!one || one.length <= 20) return;
      bars.set(row.code, one);
      names.set(row.code, row.name);
    });
    if (bars.size < 240) throw new Error(`沪深300日K只取到 ${bars.size}`);
    closeCache = { at: Date.now(), names, bars };
    return { names, bars };
  })().finally(() => {
    closeFlight = null;
  });
  return closeFlight;
}

function basketOn(day: string, names: Map<string, string>, bars: Map<string, CloseBar[]>): DayBasket | null {
  const priced: ComponentRow[] = [];
  for (const [code, series] of bars) {
    let prev: number | null = null;
    let close: number | null = null;
    for (const bar of series) {
      if (bar.date === day) {
        close = bar.close;
        break;
      }
      if (bar.date < day) prev = bar.close;
      else break;
    }
    if (close == null || prev == null || prev === 0) continue;
    const pct = ((close - prev) / prev) * 100;
    if (!Number.isFinite(pct) || Math.abs(pct) > 22.5) continue;
    priced.push({ code, name: names.get(code) ?? code, price: close, pct });
  }
  if (priced.length < 240) return null;
  const ranked = [...priced].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  let hsUp = 0;
  let hsDown = 0;
  let hsFlat = 0;
  for (const row of priced) {
    if ((row.pct ?? 0) > 0) hsUp += 1;
    else if ((row.pct ?? 0) < 0) hsDown += 1;
    else hsFlat += 1;
  }
  return {
    day,
    hsUp,
    hsDown,
    hsFlat,
    leaders: ranked.slice(0, 6),
    laggards: ranked.slice(-6).reverse(),
  };
}

export async function loadDayBasket(day: string): Promise<DayBasket | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const cached = basketCache.get(day);
  if (cached && Date.now() - cached.at < MEMBER_TTL) return cached.data;
  try {
    const { names, bars } = await loadConstituentSeries();
    const result = basketOn(day, names, bars);
    if (result) basketCache.set(day, { at: Date.now(), data: result });
    return result;
  } catch (error) {
    console.error("day-basket", error instanceof Error ? error.message : error);
    return null;
  }
}

async function loadDayMarket(day: string): Promise<DayMarket | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const text = await postForm(
        "https://apphis.longhuvip.com/w1/api/index.php",
        `a=HisZhangFuDetail&c=HisHomeDingPan&Day=${day}&PhoneOSNew=2&VerSion=5.16.0.5&apiv=w38&DeviceID=1&Token=0&UserID=0`,
        12000,
        "Dalvik/2.1.0 (Linux; U; Android 9)",
      );
      const json = JSON.parse(text) as { date?: string; info?: Record<string, string> };
      if (json.date !== day || !json.info) continue;
      const up = finiteNum(json.info.SZJS);
      const down = finiteNum(json.info.XDJS);
      const flat = finiteNum(json.info["0"]);
      if (up == null || down == null || up + down < 1000) continue;
      return {
        up,
        down,
        flat: flat ?? 0,
        limitUp: finiteNum(json.info.SJZT),
        limitDown: finiteNum(json.info.SJDT),
        hsUp: null,
        hsDown: null,
        hsFlat: null,
        leaders: [],
        laggards: [],
      };
    } catch (error) {
      console.error("day-market", error instanceof Error ? error.message : error);
    }
  }
  return null;
}

async function loadComponents(): Promise<ComponentRow[]> {
  if (componentCache && Date.now() - componentCache.at < COMPONENT_TTL) return componentCache.data;
  if (componentFlight) return componentFlight;
  componentFlight = (async () => {
    const buf = await fetchBuffer(
      "https://datacenter-web.eastmoney.com/api/data/v1/get?sortColumns=SECURITY_CODE&sortTypes=1&pageSize=300&pageNumber=1&reportName=RPT_INDEX_TS_COMPONENT&columns=SECUCODE,SECURITY_CODE,SECURITY_NAME_ABBR&quoteColumns=f2,f3&quoteType=0&filter=(TYPE%3D%221%22)",
      "https://data.eastmoney.com/",
      12000,
    );
    const json = JSON.parse(decode(buf, "utf-8")) as {
      result?: { data?: Array<Record<string, unknown>> };
    };
    const rows = (json.result?.data ?? []).map((item) => {
      const price = typeof item.f2 === "number" ? item.f2 : num(String(item.f2 ?? ""));
      const pct = typeof item.f3 === "number" ? item.f3 : num(String(item.f3 ?? ""));
      return {
        code: String(item.SECURITY_CODE ?? ""),
        name: String(item.SECURITY_NAME_ABBR ?? ""),
        price: price != null && Number.isFinite(price) ? price : null,
        pct: pct != null && Number.isFinite(pct) ? pct : null,
      };
    });
    if (rows.length === 0) throw new Error("成分列表为空");
    componentCache = { at: Date.now(), data: rows };
    return rows;
  })().finally(() => {
    componentFlight = null;
  });
  return componentFlight;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1] ? decodeXml(match[1]) : "";
}

function kindOf(source: string): { kind: ArchiveKind; tag: string } {
  if (source.includes("鳄鱼")) return { kind: "review", tag: "每日复盘" };
  if (source.includes("信息差")) return { kind: "intel", tag: "每日信息" };
  return { kind: "other", tag: source || "其他" };
}

async function readReview(link: string): Promise<{ verdict: string; excerpt: string; amountWanYi: number | null }> {
  const hit = directNotes.get(link);
  if (hit) return hit;
  const wechat = link.includes("mp.weixin.qq.com");
  const buf = await fetchBuffer(link, wechat ? "https://mp.weixin.qq.com/" : "https://gator.ronchy2000.top/", wechat ? 15000 : 12000);
  const html = decode(buf, "utf-8");
  const content = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/i)?.[1];
  const parsed = reviewText(content ?? html);
  if (wechat) directNotes.set(link, parsed);
  return parsed;
}

async function loadDirectReviews(): Promise<ArchiveItem[]> {
  const items: ArchiveItem[] = [];
  for (const link of DIRECT_REVIEWS) {
    try {
      const buf = await fetchBuffer(link, "https://mp.weixin.qq.com/", 15000);
      const html = decode(buf, "utf-8");
      const title = unescapeHtml(html.match(/property="og:title" content="([^"]*)"/)?.[1] ?? "").trim();
      if (!title) continue;
      const source =
        unescapeHtml(html.match(/id="js_name"[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "")
          .replace(/<[^>]+>/g, "")
          .trim() || "像鳄鱼一样思考";
      const ct = Number(html.match(/var ct = "(\d+)"/)?.[1] ?? "");
      const content = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/i)?.[1] ?? "";
      const parsed = reviewText(content || html);
      directNotes.set(link, parsed);
      const { kind, tag } = kindOf(source);
      items.push({
        title,
        link,
        summary: parsed.verdict || "每日复盘",
        time: Number.isFinite(ct) && ct > 1e9 ? ct * 1000 : Date.now(),
        source,
        kind: kind === "other" ? "review" : kind,
        tag: kind === "other" ? "每日复盘" : tag,
      });
    } catch (error) {
      console.error("direct-review", error instanceof Error ? error.message : error);
    }
  }
  return items;
}

async function loadRss(): Promise<ArchiveItem[]> {
  if (rssCache && Date.now() - rssCache.at < RSS_TTL) return rssCache.data;
  if (rssFlight) return rssFlight;
  rssFlight = (async () => {
    const buf = await fetchBuffer("https://gator.ronchy2000.top/rss.xml", "https://gator.ronchy2000.top/", 12000);
    const xml = decode(buf, "utf-8");
    const items: ArchiveItem[] = [];
    for (const chunk of xml.split("<item>").slice(1)) {
      const block = chunk.split("</item>")[0] ?? "";
      const title = pickTag(block, "title");
      const link = pickTag(block, "link");
      if (!title || !link) continue;
      const source = pickTag(block, "source");
      const { kind, tag } = kindOf(source);
      const time = Date.parse(pickTag(block, "pubDate"));
      items.push({
        title,
        link,
        summary: pickTag(block, "description"),
        time: Number.isFinite(time) ? time : 0,
        source,
        kind,
        tag,
      });
    }
    for (const extra of await loadDirectReviews()) {
      const day = dayOf(extra);
      const covered = items.some((row) => row.kind === extra.kind && dayOf(row) === day);
      if (!covered) items.push(extra);
    }
    items.sort((a, b) => b.time - a.time);
    if (items.length === 0) throw new Error("档案为空");
    rssCache = { at: Date.now(), data: items };
    return items;
  })().finally(() => {
    rssFlight = null;
  });
  return rssFlight;
}

async function loadReports(): Promise<ArchiveItem[]> {
  if (reportCache && Date.now() - reportCache.at < REPORT_TTL) return reportCache.data;
  if (reportFlight) return reportFlight;
  reportFlight = (async () => {
    const buf = await fetchBuffer("https://gator.ronchy2000.top/reports/", "https://gator.ronchy2000.top/", 15000);
    const html = decode(buf, "utf-8");
    const re =
      /<time datetime="([^"]+)"[^>]*>[^<]*<\/time><span class="category[^"]*"[^>]*>([^<]*)<\/span><a href="(\/reports\/\d+\/)"[^>]*><h3[^>]*>([^<]*)<\/h3>/g;
    const items: ArchiveItem[] = [];
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = re.exec(html))) {
      const href = match[3] ?? "";
      if (!href || seen.has(href)) continue;
      seen.add(href);
      const time = Date.parse(match[1] ?? "");
      const tag = (match[2] ?? "").trim() || "历史研报";
      items.push({
        title: (match[4] ?? "").trim(),
        link: `https://gator.ronchy2000.top${href}`,
        summary: tag,
        time: Number.isFinite(time) ? time : 0,
        source: "历史研报",
        kind: "report",
        tag,
      });
    }
    items.sort((a, b) => b.time - a.time);
    if (items.length === 0) throw new Error("研报列表为空");
    reportCache = { at: Date.now(), data: items };
    return items;
  })().finally(() => {
    reportFlight = null;
  });
  return reportFlight;
}

function countsOf(items: ArchiveItem[]): ArchivePayload["counts"] {
  const counts = { all: items.length, review: 0, intel: 0, report: 0 };
  for (const item of items) {
    if (item.kind === "review") counts.review += 1;
    else if (item.kind === "intel") counts.intel += 1;
    else if (item.kind === "report") counts.report += 1;
  }
  return counts;
}

export async function loadFeed(input: {
  q: string;
  source: ArchiveSource;
  limit: number;
  includeReports: boolean;
}): Promise<ArchivePayload> {
  const warnings: string[] = [];
  let rss: ArchiveItem[] = [];
  let reports: ArchiveItem[] = [];
  try {
    rss = await loadRss();
  } catch {
    warnings.push("每日档案暂时没有取到");
  }
  if (input.includeReports) {
    try {
      reports = await loadReports();
    } catch {
      warnings.push("历史研报暂时没有取到");
    }
  }
  const all = [...rss, ...reports];
  const q = input.q.trim().toLowerCase();
  const filtered = all.filter((item) => {
    if (input.source === "review" && item.kind !== "review") return false;
    if (input.source === "intel" && item.kind !== "intel") return false;
    if (input.source === "report" && item.kind !== "report") return false;
    if (!q) return true;
    return `${item.title} ${item.summary} ${item.tag}`.toLowerCase().includes(q);
  });
  return {
    items: filtered.slice(0, input.limit),
    matched: filtered.length,
    counts: countsOf(all),
    warning: warnings.length ? warnings.join("；") : null,
  };
}

function indicatorsFrom(
  hs300: Quote,
  sh: Quote,
  szAmount: number | null,
  hstech: Quote,
  fx: Quote,
  bond: Quote,
  futures: { price: number; stamp: string } | null,
): Indicators {
  const shAmt = sh.amountYi;
  const av =
    shAmt != null && szAmount != null ? Math.round(((shAmt + szAmount) / 10000) * 100) / 100 : null;
  const bs =
    hs300.price != null && futures ? Math.round((hs300.price - futures.price) * 100) / 100 : null;
  return {
    bs,
    uc: fx.price,
    hk: hstech.pct,
    av,
    cn10: bond.pct,
    futures: futures?.price ?? null,
    futuresStamp: futures?.stamp ?? "",
  };
}

function emptyDesk(warning: string): Desk {
  return {
    asOf: Date.now(),
    hs300: emptyQuote("000300", "沪深300"),
    sh: emptyQuote("000001", "上证指数"),
    cyb: emptyQuote("399006", "创业板指"),
    hstech: emptyQuote("HSTECH", "恒生科技"),
    fx: emptyQuote("USDCNH", "离岸人民币"),
    bond: emptyQuote("511260", "十年国债ETF"),
    indicators: {
      bs: null,
      uc: null,
      hk: null,
      av: null,
      cn10: null,
      futures: null,
      futuresStamp: "",
    },
    breadth: emptyBreadth(),
    leaders: [],
    laggards: [],
    series: [],
    shSeries: [],
    tape: [],
    emotion: null,
    ladder: [],
    brokers: null,
    margin: [],
    author: null,
    feed: [],
    notes: [],
    boardLead: null,
    warnings: [warning],
  };
}

export async function loadDesk(): Promise<Desk> {
  if (deskCache && Date.now() - deskCache.at < DESK_TTL) return deskCache.data;
  const warnings: string[] = [];
  const [sinaRes, futRes, compRes, seriesRes, feedRes, emotionRes, marginRes, authorRes, hotRes, rssRes] =
    await Promise.allSettled([
      loadSina(),
      loadFutures(),
      loadComponents(),
      loadSeries(),
      loadFeed({ q: "", source: "all", limit: 4, includeReports: false }),
      loadEmotion(),
      loadMargin(),
      loadAuthor(),
      loadHotBoard(),
      loadRss(),
    ]);

  if (sinaRes.status === "rejected") {
    return emptyDesk("指数行情没有取到，过一会儿再刷新");
  }
  const sina = sinaRes.value;
  const hs300 = indexQuote("000300", "沪深300", sina.sh000300);
  const sh = indexQuote("000001", "上证指数", sina.sh000001);
  const cyb = indexQuote("399006", "创业板指", sina.sz399006);
  const bond = indexQuote("511260", "十年国债ETF", sina.sh511260);
  const hstech = hstechQuote(sina.rt_hkHSTECH);
  const fx = fxQuote(sina.fx_susdcnh);
  const sz = indexQuote("399107", "深证A指", sina.sz399107);
  if (hs300.price == null) warnings.push("沪深300行情不完整");
  if (futRes.status === "rejected" || !futRes.value) warnings.push("沪深加权期货没有取到，基差先空着");
  const futures = futRes.status === "fulfilled" ? futRes.value : null;

  let rows: ComponentRow[] = [];
  if (compRes.status === "fulfilled") rows = compRes.value;
  else warnings.push("沪深300成分没有取到，涨跌家数先空着");
  if (seriesRes.status === "rejected" || (seriesRes.status === "fulfilled" && seriesRes.value.tape.length === 0)) {
    warnings.push("走势没有取到");
  }
  if (emotionRes.status === "rejected") warnings.push("全市场涨跌家数没有取到");
  if (marginRes.status === "rejected") warnings.push("融资余额没有取到");
  const slim = (quote: Quote): LadderQuote => ({
    code: quote.code,
    name: quote.name,
    price: quote.price,
    pct: quote.pct,
  });
  const ladder = [
    slim(indexQuote("000016", "上证50", sina.sh000016)),
    slim(hs300),
    slim(indexQuote("000905", "中证500", sina.sh000905)),
    slim(indexQuote("000852", "中证1000", sina.sh000852)),
    slim(indexQuote("399303", "国证2000", sina.sz399303)),
  ];
  let feed: ArchiveItem[] = [];
  if (feedRes.status === "fulfilled") {
    feed = feedRes.value.items;
    if (feedRes.value.warning) warnings.push(feedRes.value.warning);
  } else warnings.push("档案暂时没有取到");

  const ranked = rows.filter((row) => row.pct != null).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
  const desk: Desk = {
    asOf: Date.now(),
    hs300,
    sh,
    cyb,
    hstech,
    fx,
    bond,
    indicators: indicatorsFrom(hs300, sh, sz.amountYi, hstech, fx, bond, futures),
    breadth: summarize(rows),
    leaders: ranked.slice(0, 6),
    laggards: ranked.slice(-6).reverse(),
    series: seriesRes.status === "fulfilled" ? seriesRes.value.hs300 : [],
    shSeries: seriesRes.status === "fulfilled" ? seriesRes.value.sh : [],
    tape: seriesRes.status === "fulfilled" ? seriesRes.value.tape : [],
    emotion: emotionRes.status === "fulfilled" ? emotionRes.value : null,
    ladder,
    brokers: slim(indexQuote("399975", "证券公司", sina.sz399975)),
    margin: marginRes.status === "fulfilled" ? marginRes.value : [],
    author: authorRes.status === "fulfilled" ? authorRes.value : null,
    feed,
    notes: rssRes.status === "fulfilled" ? toNotes(rssRes.value) : [],
    boardLead: hotRes.status === "fulfilled" ? hotRes.value : null,
    warnings,
  };
  if (desk.tape.length > 0 && desk.sh.price != null) deskCache = { at: Date.now(), data: desk };
  void loadConstituentSeries().catch((error) => {
    console.error("warm-basket", error instanceof Error ? error.message : error);
  });
  return desk;
}

export async function loadBreadth(): Promise<BreadthPayload> {
  if (breadthCache && Date.now() - breadthCache.at < BREADTH_TTL) return breadthCache.data;
  try {
    const rows = await loadComponents();
    const payload: BreadthPayload = {
      asOf: Date.now(),
      rows,
      breadth: summarize(rows),
      warning: null,
    };
    breadthCache = { at: Date.now(), data: payload };
    return payload;
  } catch {
    return { asOf: Date.now(), rows: [], breadth: emptyBreadth(), warning: "沪深300成分没有取到" };
  }
}
