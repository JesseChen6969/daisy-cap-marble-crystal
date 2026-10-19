import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ArchiveItem, Desk, Emotion, Quote, TapePoint } from "./market.types.ts";
import { selectArchive, unescapeHtml } from "./market.server.ts";
import { paceVolume, scoreDesk } from "./scorecard.ts";

function quote(code: string, name: string, price: number, pct: number, date: string): Quote {
  return {
    code,
    name,
    price,
    change: price * (pct / 100),
    pct,
    open: price,
    high: price,
    low: price,
    prev: price / (1 + pct / 100),
    amountYi: 8000,
    date,
    time: "15:00:00",
  };
}

function point(date: string, sh: number): TapePoint {
  return {
    date,
    sh,
    hs300: sh,
    cyb: 0,
    small: 0,
    kc: 0,
    alla: 0,
    vol: 1.5,
    shClose: 3900,
    hs300Close: 4200,
    cybClose: 2800,
    a50: sh,
    zz500: 0,
    gz: 0,
    brokers: 0,
    hstech: 0,
    hstechClose: 5000,
    bond: 0,
    bondClose: 1,
    fx: 0,
    fxClose: 7.1,
  };
}

function desk(tape: TapePoint[], emotion: Emotion | null, date = tape.at(-1)?.date ?? "2026-10-19"): Desk {
  return {
    asOf: Date.parse(`${date}T15:00:00+08:00`),
    hs300: quote("000300", "沪深300", 4200, 1, date),
    sh: quote("000001", "上证指数", 3900, 1, date),
    cyb: quote("399006", "创业板指", 2800, 0.2, date),
    hstech: quote("HSTECH", "恒生科技", 5000, 0.4, date),
    fx: quote("USDCNH", "离岸人民币", 7.1, 0, date),
    bond: quote("511260", "十年国债ETF", 1, 0, date),
    indicators: { bs: 1, uc: 7.1, hk: 0.4, av: 1.6, cn10: 0, futures: 4199, futuresStamp: date },
    breadth: { tup: 180, tdn: 90, t5u: 10, t5d: 2, d50: 4, u05: 20, flat: 30, missing: 0, total: 300 },
    leaders: [],
    laggards: [],
    series: [],
    shSeries: [],
    tape,
    emotion,
    ladder: [
      { code: "000016", name: "上证50", price: null, pct: 0.4 },
      { code: "000300", name: "沪深300", price: null, pct: 1 },
      { code: "000905", name: "中证500", price: null, pct: 0.2 },
      { code: "000852", name: "中证1000", price: null, pct: 0 },
      { code: "399303", name: "国证2000", price: null, pct: -0.2 },
    ],
    brokers: { code: "399975", name: "证券公司", price: null, pct: 0.3 },
    margin: [
      { date: "2026-10-15", balanceYi: 100, netYi: 1 },
      { date: "2026-10-16", balanceYi: 101, netYi: 1 },
    ],
    author: null,
    feed: [],
    notes: [],
    boardLead: null,
    warnings: [],
  };
}

const emotion: Emotion = { date: "2026-10-16", up: 3200, down: 1500, flat: 80, limitUp: 70, limitDown: 8 };

describe("path marks stay put", () => {
  const tape = [point("2026-10-15", -2), point("2026-10-16", -1.6), point("2026-10-19", -1.2)];

  it("does not rewrite an older day when the view moves forward", () => {
    const ended = scoreDesk(desk(tape.slice(0, 2), { ...emotion, date: "2026-10-16" }, "2026-10-16"));
    const later = scoreDesk(desk(tape, { ...emotion, date: "2026-10-19" }, "2026-10-19"));
    const early = ended.series.find((row) => row.date === "2026-10-16");
    const same = later.series.find((row) => row.date === "2026-10-16");
    assert.ok(early && same);
    assert.equal(same.rate, early.rate);
    assert.equal(same.mark, early.mark);
    assert.notEqual(later.series.at(-1)?.rate, later.rate);
    assert.equal(later.seriesModel, "path-v1");
    assert.equal(later.model, "six-v1");
  });
});

describe("missing risk", () => {
  it("does not turn a blank emotion feed into a position", () => {
    const card = scoreDesk(desk([point("2026-10-19", 0.4)], null));
    assert.equal(card.longPct, null);
    assert.equal(card.shortPct, null);
    assert.equal(card.band, "数据不足");
    assert.equal(card.risk, "unknown");
    assert.match(card.positionNote, /暂不可判断/);
  });

  it("does not treat a missing limit-down count as zero", () => {
    const card = scoreDesk(
      desk([point("2026-10-19", 0.4)], {
        date: "2026-10-19",
        up: 3000,
        down: 1200,
        flat: 40,
        limitUp: 60,
        limitDown: null,
      }),
    );
    assert.equal(card.longPct, null);
    assert.equal(card.risk, "unknown");
  });
});

describe("paceVolume", () => {
  const morning = new Date("2026-10-19T02:00:00Z");

  it("keeps a finished session at its full amount", () => {
    const paced = paceVolume(1.5, { date: "2026-10-16", time: "15:00:00" }, morning);
    assert.equal(paced.value, 1.5);
  });

  it("projects only the same day's intraday print", () => {
    const paced = paceVolume(1.5, { date: "2026-10-19", time: "10:00:00" }, morning);
    assert.equal(paced.value, 12);
  });
});

describe("archive order", () => {
  it("keeps a newer report ahead of older rss rows", () => {
    const rss: ArchiveItem[] = Array.from({ length: 120 }, (_, index) => ({
      title: `旧讯 ${index}`,
      link: `https://example.test/rss/${index}`,
      summary: "",
      time: index,
      source: "获得信息差",
      kind: "intel",
      tag: "每日信息",
    }));
    const report: ArchiveItem = {
      title: "最新研报",
      link: "https://example.test/reports/9/",
      summary: "行业",
      time: 9_000,
      source: "历史研报",
      kind: "report",
      tag: "行业分析",
    };
    const page = selectArchive(rss, [report], { q: "", source: "all", limit: 120 });
    assert.equal(page.items[0]?.title, "最新研报");
    assert.equal(page.matched, 121);
    assert.equal(page.hasMore, true);
    const rest = selectArchive(rss, [report], { q: "", source: "all", limit: 200 });
    assert.equal(rest.hasMore, false);
    assert.equal(rest.items.length, 121);
  });
});

describe("unescapeHtml", () => {
  it("decodes named and numeric entities", () => {
    const raw = "&" + "amp; &" + "quot;x&" + "#39;&" + "lt;";
    assert.equal(unescapeHtml(raw), `& "x'<`);
  });
});
