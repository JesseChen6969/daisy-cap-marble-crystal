import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ArchiveItem, Desk, Emotion, Quote, TapePoint } from "./market.types.ts";
import { applyArchivePage, planArchivePage } from "./archive-query.ts";
import { countNum, decodeXml, finiteNum, readEmotionPayload, selectArchive, unescapeHtml } from "./market.server.ts";
import { carryWarnings, openDayFlight, preferCount, shownCount, takeDayFlight, type DayFlight } from "./replay.ts";
import { coreQuotesReady, readMarket } from "./reading.ts";
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

  it("decodes the rss path too", () => {
    const raw = "<title>A &" + "amp; B</title>";
    assert.equal(decodeXml(raw), "A & B");
  });
});

describe("missing counts stay missing", () => {
  it("does not turn null into zero, and keeps a real backup", () => {
    assert.equal(finiteNum(null), null);
    assert.equal(finiteNum(""), null);
    assert.equal(countNum(null), null);
    assert.equal(countNum(0), 0);
    assert.equal(preferCount(countNum(null), 50), 50);
    assert.equal(preferCount(null, null), null);
    const kept = scoreDesk(
      desk([point("2026-10-19", 0.2)], {
        date: "2026-10-19",
        up: 800,
        down: 2500,
        flat: 40,
        limitUp: 20,
        limitDown: preferCount(countNum(null), 50),
      }),
    );
    assert.equal(kept.band, "回避");
    assert.equal(kept.risk, "triggered");
    assert.equal(kept.longPct, 0);
    const blank = scoreDesk(
      desk([point("2026-10-19", 0.2)], {
        date: "2026-10-19",
        up: 800,
        down: 2500,
        flat: 40,
        limitUp: 20,
        limitDown: preferCount(null, null),
      }),
    );
    assert.equal(blank.longPct, null);
    assert.equal(blank.risk, "unknown");
  });
});

describe("missing index quotes", () => {
  it("does not restore a position when the index print is empty", () => {
    const base = desk([point("2026-10-19", 0.4)], {
      date: "2026-10-19",
      up: 3200,
      down: 1500,
      flat: 80,
      limitUp: 40,
      limitDown: 8,
    });
    base.sh = { ...base.sh, price: null };
    const card = scoreDesk(base);
    const reading = readMarket(base);
    assert.equal(card.longPct, null);
    assert.equal(card.shortPct, null);
    assert.equal(card.band, "数据不足");
    assert.equal(reading.phase, "先看原文");
    assert.match(reading.position, /暂不可判断/);
    assert.doesNotMatch(reading.headline, /试多|右侧要看/);
  });
});

describe("path gaps", () => {
  it("does not invent a buy when other index legs are missing", () => {
    const full = [point("2026-10-15", -2), point("2026-10-16", 0)];
    const gapped = [point("2026-10-15", -2), { ...point("2026-10-16", 0), hs300: null, small: null, cyb: null }];
    const marked = scoreDesk(desk(full, null, "2026-10-16")).series.at(-1);
    const open = scoreDesk(desk(gapped, null, "2026-10-16")).series.at(-1);
    assert.equal(marked?.mark, "买");
    assert.equal(open?.rate, null);
    assert.equal(open?.mark, null);
  });
});

describe("warnings and pages", () => {
  it("keeps the missing-quote note when a later line is added", () => {
    const lines = carryWarnings(["2026-10-16 的行情这一笔没对上。"], "补上了涨跌家数。");
    assert.match(lines[0] ?? "", /没对上/);
    assert.equal(lines[1], "补上了涨跌家数。");
  });

  it("stops offering another page after the last slice", () => {
    const rss: ArchiveItem[] = Array.from({ length: 30 }, (_, index) => ({
      title: `条目 ${index}`,
      link: `https://example.test/page/${index}`,
      summary: "",
      time: index,
      source: "获得信息差",
      kind: "intel",
      tag: "每日信息",
    }));
    const last = selectArchive([], rss, { q: "", source: "all", limit: 24, offset: 24 });
    assert.equal(last.items.length, 6);
    assert.equal(last.hasMore, false);
  });
});

function fenbu(limitDown: number | null) {
  return readEmotionPayload({
    data: {
      qdate: 20261019,
      fenbu: [{ "1": 800 }, { "-1": 2500 }, { "0": 40 }, { "11": 20 }, { "-11": limitDown }],
    },
  });
}

describe("live emotion buckets", () => {
  it("keeps an explicit null limit-down unknown on the live parser", () => {
    const healthy = fenbu(50);
    const blank = fenbu(null);
    assert.equal(healthy?.limitDown, 50);
    assert.equal(blank?.limitDown, null);
    assert.notEqual(blank?.limitDown, 0);
    const kept = scoreDesk(desk([point("2026-10-19", -1.2)], healthy));
    const open = scoreDesk(desk([point("2026-10-19", -1.2)], blank));
    assert.equal(kept.band, "回避");
    assert.equal(kept.longPct, 0);
    assert.equal(open.longPct, null);
    assert.equal(open.risk, "unknown");
    assert.equal(shownCount(null, blank?.limitDown), "—");
    assert.equal(shownCount(null, 50), "50");
  });
});

describe("request identity", () => {
  it("does not let an older reply for the same day replace a newer one", () => {
    let flight: DayFlight = null;
    let seq = 0;
    let selected = "A";
    let shown = "";
    const start = (day: string) => {
      selected = day;
      const opened = openDayFlight(flight, day, seq + 1);
      flight = opened.flight;
      if (opened.token != null) seq = opened.token;
      return opened.token;
    };
    const land = (token: number | null, day: string, payload: string) => {
      if (token == null) return;
      const taken = takeDayFlight(flight, token, day, selected);
      flight = taken.flight;
      if (taken.accept) shown = payload;
    };
    const first = start("A");
    assert.equal(start("A"), null);
    start("B");
    const second = start("A");
    land(second, "A", "full");
    land(first, "A", "partial");
    assert.equal(shown, "full");
  });
});

describe("archive paging", () => {
  it("refuses to page a new query from the previous list, and allows the same offset to be retried", () => {
    const loaded = { q: "", source: "all" };
    const blocked = planArchivePage({
      current: { q: "陶瓷", source: "all" },
      loaded,
      loadedCount: 24,
      pending: false,
    });
    assert.equal(blocked.allowed, false);
    assert.deepEqual(applyArchivePage(["旧 1"], 0, ["新 1"]), ["新 1"]);
    const next = planArchivePage({ current: loaded, loaded, loadedCount: 24, pending: false });
    assert.equal(next.allowed, true);
    assert.equal(next.offset, 24);
    const retry = planArchivePage({ current: loaded, loaded, loadedCount: 24, pending: false });
    assert.equal(retry.allowed, true);
    assert.equal(retry.offset, 24);
  });
});

describe("quote dates", () => {
  it("does not size a position when the core indexes are from different days", () => {
    const emotion = {
      date: "2026-10-19",
      up: 3200,
      down: 1500,
      flat: 80,
      limitUp: 40,
      limitDown: 8,
    };
    const aligned = desk([point("2026-10-19", 0.4)], emotion);
    const split = desk([point("2026-10-19", 0.4)], emotion);
    split.hs300 = { ...split.hs300, date: "2026-10-16" };
    assert.equal(coreQuotesReady(aligned.sh, aligned.hs300, aligned.cyb), true);
    assert.equal(coreQuotesReady(split.sh, split.hs300, split.cyb), false);
    assert.notEqual(scoreDesk(aligned).longPct, null);
    const card = scoreDesk(split);
    assert.equal(card.longPct, null);
    assert.equal(card.band, "数据不足");
    assert.match(card.positionNote, /同一天/);
  });
});
