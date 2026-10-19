import type { ArchiveItem, Desk, LadderQuote, Quote } from "./market.types";

export function preferCount(primary: number | null | undefined, backup: number | null | undefined): number | null {
  return primary ?? backup ?? null;
}

export function carryWarnings(previous: string[], next: string): string[] {
  return [...previous.filter((line) => /没对上|没有取到|不参与评分|不是同一天/.test(line)), next];
}

export function replayDesk(desk: Desk, day: string | null): { desk: Desk; historical: boolean } {
  const live = (desk.sh.date || desk.hs300.date || "").slice(0, 10);
  if (!day || day === live) return { desk, historical: false };
  const point = desk.tape.find((row) => row.date === day);
  if (!point) {
    const quiet = (quote: Quote): Quote => ({
      ...quote,
      price: null,
      change: null,
      pct: null,
      amountYi: null,
      date: day,
      time: "15:00:00",
    });
    return {
      historical: true,
      desk: {
        ...desk,
        sh: quiet(desk.sh),
        hs300: quiet(desk.hs300),
        cyb: quiet(desk.cyb),
        hstech: quiet(desk.hstech),
        fx: quiet(desk.fx),
        bond: quiet(desk.bond),
        indicators: { bs: null, uc: null, hk: null, av: null, cn10: null, futures: null, futuresStamp: "" },
        breadth: { tup: 0, tdn: 0, t5u: 0, t5d: 0, d50: 0, u05: 0, flat: 0, missing: 0, total: 0 },
        leaders: [],
        laggards: [],
        emotion: null,
        ladder: [],
        brokers: null,
        author: null,
        feed: [],
        boardLead: null,
        series: [],
        shSeries: [],
        tape: [],
        margin: [],
        warnings: [`${day} 的行情这一笔没对上。日期仍停在这一天，不会跳回今天。`],
      },
    };
  }
  const blank = (code: string, name: string): Quote => ({
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
    date: point.date,
    time: "15:00:00",
  });
  const rung = (code: string, name: string, pct: number | null): LadderQuote => ({ code, name, price: null, pct });
  const dayNotes = (desk.notes ?? []).filter((item) => item.day === point.date);
  const review = dayNotes.find((item) => item.kind === "review") ?? null;
  const feed: ArchiveItem[] = dayNotes.map((item) => ({
    title: item.title,
    link: item.link,
    summary: "",
    time: Date.parse(`${item.day}T15:00:00+08:00`),
    source: item.kind === "review" ? "像鳄鱼一样思考" : "获得信息差",
    kind: item.kind,
    tag: item.tag,
  }));
  const filled = ["指数", "上证成交量", "融资余额"];
  if (point.hstech != null) filled.push("恒生科技");
  if (point.bond != null) filled.push("十年国债");
  if (point.fxClose != null) filled.push("离岸人民币");
  const missing: string[] = [];
  if (point.hstech == null) missing.unshift("恒生科技");
  if (point.bond == null) missing.push("十年国债");
  if (point.fxClose == null) missing.push("离岸人民币");
  const reviewLine = review ? "这一天的公众号在消息面。" : "公开档案里没有这一天的复盘。";
  const gap = missing.length ? `${missing.join("、")}没有按日名单。` : "";
  return {
    historical: true,
    desk: {
      ...desk,
      asOf: Date.parse(`${point.date}T15:00:00+08:00`),
      sh: priced(desk.sh, point.shClose, point.sh, point.date),
      hs300: priced(desk.hs300, point.hs300Close, point.hs300, point.date),
      cyb: priced(desk.cyb, point.cybClose, point.cyb, point.date),
      hstech:
        point.hstechClose != null
          ? priced(desk.hstech, point.hstechClose, point.hstech, point.date)
          : blank("HSTECH", "恒生科技"),
      fx:
        point.fxClose != null
          ? priced(desk.fx, point.fxClose, point.fx, point.date)
          : blank("USDCNH", "离岸人民币"),
      bond:
        point.bondClose != null
          ? priced(desk.bond, point.bondClose, point.bond, point.date)
          : blank("511260", "十年国债ETF"),
      indicators: {
        bs: null,
        uc: point.fxClose,
        hk: point.hstech,
        av: null,
        cn10: point.bond,
        futures: null,
        futuresStamp: "",
      },
      breadth: { tup: 0, tdn: 0, t5u: 0, t5d: 0, d50: 0, u05: 0, flat: 0, missing: 0, total: 0 },
      leaders: [],
      laggards: [],
      emotion: null,
      ladder: [
        rung("000016", "上证50", point.a50),
        rung("000300", "沪深300", point.hs300),
        rung("000905", "中证500", point.zz500),
        rung("000852", "中证1000", point.small),
        rung("399303", "国证2000", point.gz),
      ],
      brokers: rung("399975", "证券公司", point.brokers),
      margin: desk.margin.filter((row) => row.date <= point.date),
      author: review ? { title: review.title, link: review.link, verdict: "", excerpt: "" } : null,
      feed,
      boardLead: null,
      series: desk.series.filter((row) => row.date <= point.date),
      shSeries: desk.shSeries.filter((row) => row.date <= point.date),
      tape: desk.tape.filter((row) => row.date <= point.date),
      warnings: [
        `${point.date} 收盘回放。${filled.join("、")}按这一天的收盘。${gap}全市场涨跌家数和沪深300成分按这一天的行情另取，复盘原文不逐日给这两组数。${reviewLine}`,
      ],
    },
  };
}

function priced(base: Quote, close: number | null, pct: number | null, date: string): Quote {
  const prev = close != null && pct != null && pct > -100 ? close / (1 + pct / 100) : null;
  return {
    ...base,
    price: close,
    pct,
    change: close != null && prev != null ? close - prev : null,
    open: null,
    high: null,
    low: null,
    prev,
    amountYi: null,
    date,
    time: "15:00:00",
  };
}