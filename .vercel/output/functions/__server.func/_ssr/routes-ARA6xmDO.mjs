import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react, b as Link, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as shanghaiParts, c as toneOf$1, i as marketPhase, n as ZONE_ORDER, o as toneClass, t as INDICATORS } from "./zones-B6a6YmcZ.mjs";
import { i as RefreshCw, n as Settings } from "../_libs/lucide-react.mjs";
import { a as cn, c as getDayBasket, i as Route$3, l as getDayBrief, u as getDesk } from "./router-Crg4Xc9z.mjs";
import { a as fmtPct, n as fmt, o as fmtSigned, t as dirClass } from "./format-DEwBcFer.mjs";
import { a as Line, c as Radar, d as PolarGrid, f as ResponsiveContainer, i as XAxis, l as PolarAngleAxis, n as RadarChart, o as CartesianGrid, p as Tooltip, r as YAxis, s as Bar, t as ComposedChart, u as PolarRadiusAxis } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-ARA6xmDO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var LINE = 3800;
function weekKey(date) {
	const [year, month, day] = date.split("-").map(Number);
	const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
	const weekday = dt.getUTCDay() || 7;
	dt.setUTCDate(dt.getUTCDate() + 4 - weekday);
	const start = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
	const week = Math.ceil(((dt.getTime() - start.getTime()) / 864e5 + 1) / 7);
	return `${dt.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
function weeklyReturns(bars) {
	const last = /* @__PURE__ */ new Map();
	for (const bar of bars) {
		if (!bar.date) continue;
		last.set(weekKey(bar.date), bar);
	}
	const closes = [...last.values()];
	const out = [];
	for (let i = 1; i < closes.length; i += 1) {
		const prev = closes[i - 1]?.close;
		const curr = closes[i];
		if (!curr || !prev) continue;
		out.push({
			label: curr.date.slice(5),
			ret: (curr.close - prev) / prev * 100
		});
	}
	return out.slice(-8);
}
function trailingFalls(days) {
	let count = 0;
	for (let i = days.length - 1; i > 0; i -= 1) {
		const curr = days[i]?.balanceYi;
		const prev = days[i - 1]?.balanceYi;
		if (curr == null || prev == null || curr >= prev - .5) break;
		count += 1;
	}
	return count;
}
function findName(ladder, needle) {
	return ladder.find((item) => item.name.includes(needle));
}
function gapWords(gap) {
	if (gap == null) return "算不出";
	const size = Math.abs(gap);
	if (size >= 2) return "分歧严重";
	if (size >= 1) return "分歧较重";
	if (size >= .5) return "有分歧";
	return "没有明显分歧";
}
function clampScore(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(100, Math.round(n)));
}
function readSpokes(input) {
	const { emotion } = input;
	let breadth = 0;
	let breadthNote = "全市场涨跌没有取到";
	if (emotion && emotion.up + emotion.down > 0) {
		breadth = emotion.up / (emotion.up + emotion.down) * 100;
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
		if (input.cybPct > input.shPct + .8) structure = Math.min(structure, 26);
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
		volume = input.av < 1.8 ? 18 + Math.max(0, input.av - .8) * 32 : 52 + (input.av - 1.8) * 55;
		volumeNote = `沪深成交 ${fmt(input.av)} 万亿`;
	}
	let week = 0;
	let weekNote = "周线没有取到";
	if (input.weeksKnown) {
		week = input.downWeeks === 0 ? 84 : 78 - input.downWeeks * 16;
		weekNote = input.downWeeks > 0 ? `上证周线连跌 ${input.downWeeks} 周` : "上证周线这周没有再跌";
	}
	return [
		{
			axis: "效应",
			label: "赚钱效应",
			score: clampScore(breadth),
			note: breadthNote
		},
		{
			axis: "护盘",
			label: "护盘线",
			score: clampScore(line),
			note: lineNote
		},
		{
			axis: "结构",
			label: "盘面结构",
			score: clampScore(structure),
			note: structureNote
		},
		{
			axis: "证券",
			label: "气氛组",
			score: clampScore(mood),
			note: moodNote
		},
		{
			axis: "杠杆",
			label: "杠杆",
			score: clampScore(leverage),
			note: leverageNote
		},
		{
			axis: "量能",
			label: "量能",
			score: clampScore(volume),
			note: volumeNote
		},
		{
			axis: "周线",
			label: "周线",
			score: clampScore(week),
			note: weekNote
		}
	];
}
function clampTo(n, max) {
	if (!Number.isFinite(n)) return 0;
	return Math.max(0, Math.min(max, Math.round(n)));
}
function readBoard(input) {
	const { desk, spokes } = input;
	const { emotion, sh, cyb, hs300, hstech, brokers, ladder } = desk;
	const a50 = findName(ladder, "50");
	let inst = 10 + (input.gapBig ?? 0) * 5;
	if ((hs300.pct ?? 0) < -1) inst -= 6;
	if ((hs300.pct ?? 0) > .8) inst += 4;
	let team = 4;
	if (emotion?.limitDown != null && emotion.limitDown <= 15) team += 6;
	if (emotion?.limitDown != null && emotion.limitDown >= 40) team -= 6;
	if ((a50?.pct ?? -1) >= -.3) team += 4;
	if (sh.price != null && sh.price >= LINE) team += 10;
	else if (sh.price != null && sh.price >= 3750) team += 2;
	if (input.forceLabel === "小维护") team += 3;
	if (input.forceLabel === "像一起拉") team += 6;
	const foreign = hstech.pct == null ? 0 : 6 + hstech.pct * 2.5;
	let retail = 0;
	if (emotion && emotion.up + emotion.down > 0) {
		retail = emotion.up / (emotion.up + emotion.down) * 22;
		if (emotion.limitUp != null && emotion.limitUp >= 80) retail += 5;
		if (emotion.limitDown != null && emotion.limitDown >= 40) retail = Math.min(retail, 8);
	}
	let hot = emotion?.limitUp != null ? Math.min(14, emotion.limitUp / 6) : 0;
	if ((cyb.pct ?? 0) > .6) hot += 5;
	if ((brokers?.pct ?? -1) > 0) hot += 4;
	if ((cyb.pct ?? 0) < -.3) hot -= 3;
	const forces = [
		{
			axis: "机构",
			label: "机构",
			score: clampTo(inst, 25),
			max: 25,
			note: input.gapBig != null ? `沪深300对国证2000 ${fmtSigned(input.gapBig)}` : "大小票对照没有取到"
		},
		{
			axis: "国家队",
			label: "国家队",
			score: clampTo(team, 30),
			max: 30,
			note: sh.price != null ? `上证 ${fmt(sh.price, 0)}，上证50 ${fmtPct(a50?.pct)}` : "权重没有取到"
		},
		{
			axis: "外资",
			label: "外资",
			score: clampTo(foreign, 15),
			max: 15,
			note: hstech.pct != null ? `恒生科技 ${fmtPct(hstech.pct)}` : "恒生科技没有取到"
		},
		{
			axis: "散户",
			label: "散户",
			score: clampTo(retail, 31),
			max: 31,
			note: emotion ? `上涨 ${emotion.up} / 下跌 ${emotion.down}` : "涨跌家数没有取到"
		},
		{
			axis: "游资",
			label: "游资",
			score: clampTo(hot, 25),
			max: 25,
			note: emotion?.limitUp != null ? `涨停 ${emotion.limitUp}，创业板 ${fmtPct(cyb.pct)}` : "涨停家数没有取到"
		}
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
	if (input.panic || emotion?.limitDown != null && emotion.limitDown >= 40) heat = "短期冰点";
	else if (emotion?.limitUp != null && emotion.limitUp >= 90 && emotion.up > emotion.down * 1.8) heat = "过热";
	else if (input.healed && !input.volumeHot) heat = "不热";
	const quiet = sh.pct != null && cyb.pct != null && Math.abs(sh.pct) < .8 && Math.abs(cyb.pct) < 1.2 ? "安静" : "有波动";
	return {
		rate,
		band,
		pattern,
		patternNote: input.forceLabel,
		heat,
		quiet,
		forces,
		forceSum,
		forceMax
	};
}
function readClock(bars, price) {
	if (bars.length < 8) return {
		underLine: null,
		fromHigh: null,
		fromLow: null,
		nearDays: null,
		bounce: null,
		shape: "未知",
		note: "上证日线不够，磨了多久先不算。"
	};
	let underLine = 0;
	for (let i = bars.length - 1; i >= 0; i -= 1) {
		if (bars[i].close >= LINE) break;
		underLine += 1;
	}
	const window = bars.slice(-40);
	let lowIdx = 0;
	for (let i = 1; i < window.length; i += 1) if (window[i].low < window[lowIdx].low) lowIdx = i;
	let highIdx = 0;
	for (let i = 0; i <= lowIdx; i += 1) if (window[i].high >= window[highIdx].high) highIdx = i;
	const fromHigh = window.length - 1 - highIdx;
	const fromLow = window.length - 1 - lowIdx;
	const low = window[lowIdx].low;
	const lastClose = price ?? window[window.length - 1]?.close ?? low;
	const bounce = low > 0 ? (lastClose - low) / low * 100 : null;
	const camp = low * 1.015;
	let campStart = window.length - 1;
	for (let i = window.length - 1; i >= 0; i -= 1) {
		const bar = window[i];
		if (bar.low <= camp || bar.close <= camp) campStart = i;
		else break;
	}
	const nearDays = window.length - campStart;
	let shape = "磨";
	if (bounce != null && fromLow <= 2 && bounce >= 1.2) shape = "V";
	else if (bounce != null && fromLow >= 3 && bounce < 2.5) shape = "U";
	const shapeWord = shape === "V" ? "这根是拉起来的 V。他们写过，走 V 容易被按下去，走 U 才耐得住。" : shape === "U" ? "更像贴着低点磨的 U。他们把 U 看成比 V 更有持续性的那种底。" : fromLow <= 2 ? "低点就在旁边，还看不出会走成 V 还是 U。" : "还在高低之间晃，既不是一根 V 拉起来，也还没磨成贴地的 U。";
	const timeWord = nearDays < 11 ? `贴着这段低点 ${nearDays} 个交易日，短于他们对照过的 11、12、17 日，所以时间还不够。` : nearDays < 17 ? `贴着低点 ${nearDays} 个交易日，接近较短的那几次磨底。天数到了也不等于成功，还得看结构。` : `贴着低点已经 ${nearDays} 个交易日，不短于他们举过的例子。成不成功，还是看有没有换成非科技带队。`;
	return {
		underLine,
		fromHigh,
		fromLow,
		nearDays,
		bounce,
		shape,
		note: `收盘连续 ${underLine} 天在 3800 下。${timeWord}从高点下来 ${fromHigh} 个交易日，那是下跌的长度，不是磨底的长度。离低点 ${fromLow} 天，反弹 ${bounce == null ? "—" : bounce.toFixed(1)}%。${shapeWord}`
	};
}
function readForce(ladder, hs300Pct, shPct, cybPct, volumeHot) {
	const a50 = findName(ladder, "50");
	const a500 = findName(ladder, "500");
	const a1000 = findName(ladder, "1000");
	const small = findName(ladder, "2000");
	if (a50?.pct == null || hs300Pct == null) return {
		label: "看不清",
		note: "权重指数不齐，护盘力度先不下判断。"
	};
	const weightsOk = [
		a50.pct,
		hs300Pct,
		a500?.pct
	].filter((n) => n != null).every((n) => n > -.3);
	const smallLag = small?.pct != null && a50.pct - small.pct > .4;
	const techHot = cybPct != null && shPct != null && cybPct > shPct + .5;
	if ([
		a50.pct,
		hs300Pct,
		a500?.pct,
		a1000?.pct,
		cybPct
	].every((n) => n != null && n > .6) && volumeHot) return {
		label: "像一起拉",
		note: "宽基、小票、创业板一起明显转强，而且成交不轻。是不是开会、发利好，行情里看不出来。他们写过，这个位置如果非要大救市，反而要离远一点。"
	};
	if (techHot && !weightsOk) return {
		label: "结构不对",
		note: "科技还在抢风头，权重没有站住。他们把这种日子看成流程没走完：没钱硬拉科技，会跌得更深。"
	};
	if (weightsOk && (smallLag || cybPct != null && shPct != null && cybPct < shPct)) return {
		label: "小维护",
		note: "上证50、沪深300比创业板稳，跌速被按住了，但不是把指数直接拉起来。三板斧里的买宽基、发利好，这组数字对不上，就不算数。"
	};
	return {
		label: "不好归类",
		note: "指数彼此差不多，看不出是在拉权重，还是市场自己在磨。"
	};
}
function readMarket(desk) {
	const { sh, cyb, hs300, emotion, ladder, brokers, margin, indicators } = desk;
	const weeks = weeklyReturns(desk.shSeries.length > 0 ? desk.shSeries : desk.series);
	let downWeeks = 0;
	for (let i = weeks.length - 1; i >= 0; i -= 1) {
		if ((weeks[i]?.ret ?? 0) >= 0) break;
		downWeeks += 1;
	}
	const low = (desk.shSeries.length > 0 ? desk.shSeries : desk.series).slice(-20).reduce((min, bar) => Math.min(min, bar.low), Number.POSITIVE_INFINITY);
	const nearLow = sh.price != null && Number.isFinite(low) && low > 0 ? (sh.price - low) / low * 100 : null;
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
	const techQuiet = cyb.pct != null && sh.pct != null && cyb.pct <= 0 && sh.pct >= cyb.pct;
	const brokersWeak = brokers?.pct == null || brokers.pct <= 0;
	const aboveLow = nearLow != null && nearLow <= 4;
	const lineBack = sh.price != null && sh.price >= LINE;
	const marginStopped = margin.length >= 2 && marginStreak === 0;
	const brokersOk = brokers?.pct != null && brokers.pct > 0;
	const volumeOk = indicators.av != null && indicators.av >= 1.8;
	const weekOk = weeks.length > 0 && downWeeks === 0;
	const force = readForce(ladder, hs300.pct, sh.pct, cyb.pct, volumeHot);
	const checks = [
		{
			label: "融资不再连撤",
			met: marginStopped,
			detail: margin.length ? `已连撤 ${marginStreak} 天，最近一日净买入 ${fmtSigned(lastNet?.netYi, 0)} 亿` : "融资余额没有取到"
		},
		{
			label: "上证收回 3800",
			met: lineBack,
			detail: sh.price != null ? `收在 ${fmt(sh.price, 0)}，复盘里把 3800 写成龙哥的线` : "上证没有取到"
		},
		{
			label: "证券气氛组转强",
			met: brokersOk,
			detail: brokers?.pct != null ? `证券公司 ${fmtPct(brokers.pct)}` : "证券指数没有取到"
		},
		{
			label: "成交出现增量",
			met: volumeOk,
			detail: indicators.av != null ? `沪深成交 ${fmt(indicators.av)} 万亿` : "成交额没有取到"
		},
		{
			label: "周线停止连跌",
			met: weekOk,
			detail: weeks.length ? `上证周线已连跌 ${downWeeks} 周` : "周线没有取到"
		}
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
		weeksKnown: weeks.length > 0
	});
	const board = readBoard({
		desk,
		spokes,
		gapBig,
		forceLabel: force.label,
		healed,
		panic,
		volumeHot
	});
	const steps = [
		{
			title: "龙哥先止血",
			state: panic ? "waiting" : lineBack && healed ? "met" : healed ? "partial" : "waiting",
			evidence: emotion ? `上涨 ${emotion.up}，下跌 ${emotion.down}，涨停 ${emotion.limitUp ?? "未知"}，跌停 ${emotion.limitDown ?? "未知"}` : "全市场涨跌没有取到"
		},
		{
			title: "别硬拉科技",
			state: techQuiet ? "met" : sh.pct != null && cyb.pct != null && cyb.pct > sh.pct + .8 ? "waiting" : "partial",
			evidence: sh.pct != null && cyb.pct != null ? `上证 ${fmtPct(sh.pct)}，创业板 ${fmtPct(cyb.pct)}` : "指数对照没有取到"
		},
		{
			title: "钱从科技流向别处",
			state: techQuiet && !brokersWeak ? "met" : techQuiet ? "partial" : "waiting",
			evidence: brokersWeak ? "权重没有被创业板抢走，但证券这个气氛组还是弱的" : "证券跟着转强，非科技这边有响应"
		},
		{
			title: "非科技带指数止跌",
			state: !belowLine && aboveLow && healed ? "met" : healed && aboveLow ? "partial" : "waiting",
			evidence: belowLine ? `上证还在 3800 下方${nearLow != null ? `，离近 20 日低点 ${fmt(nearLow, 1)}%` : ""}。${clock.shape === "V" ? "形状是 V。" : clock.shape === "U" ? "形状更接近 U。" : "还在磨。"}` : "上证已回到 3800 之上"
		},
		{
			title: "杠杆哥进场",
			state: marginStopped && (lastNet?.netYi ?? 0) > 0 ? "met" : marginStreak > 0 ? "waiting" : "partial",
			evidence: margin.length ? `融资余额连撤 ${marginStreak} 天` : "融资余额没有取到"
		},
		{
			title: "反弹有没有钱维持",
			state: volumeHot && marginStopped ? "met" : volumeHot || marginStopped ? "partial" : "waiting",
			evidence: `成交 ${indicators.av != null ? `${fmt(indicators.av)} 万亿` : "未知"}，期货贴水 ${fmt(indicators.bs, 0)} 点`
		}
	];
	const metCount = checks.filter((item) => item.met).length;
	const limitsKnown = emotion != null && emotion.limitDown != null && emotion.limitUp != null;
	const quotesKnown = sh.price != null && hs300.price != null && cyb.price != null;
	const decisionReady = Boolean(emotion) && limitsKnown && quotesKnown;
	let headline = "数字不齐，先不把今天说死。";
	if (panic) headline = "跌停还堆着，恐慌没过去。这个位置谈市场底太早。";
	else if (!decisionReady) headline = "数字不齐，先不把今天说死。";
	else if (metCount >= 4) headline = "右侧要看的几件事大多转过来了。即便如此，也还是底仓的思路，不是梭哈。";
	else if (healed) headline = "护盘把恐慌按住了，市场底还在磨。可以试多，右侧还没有。";
	else headline = "上涨家数还没压过下跌，止跌流程没有走完。";
	const phase = panic ? "恐慌未散" : !decisionReady ? "先看原文" : metCount >= 4 ? "右侧靠近" : healed ? "市场底还在磨" : "止跌没走完";
	const phaseNote = !decisionReady ? "关键行情或跌停没有对齐，先不把这一天说成右侧或试多。" : panic ? "跌停还多，这是恐慌，不是磨底。护盘底都还谈不上。" : healed ? "护盘底看的是跌停有没有蔓延、指数有没有失控。这一层大致按住了。市场底要市场自己磨出来，最好是 U 不是 V，而且非科技来带。时间不够的时候，他们不把试多说成右侧。" : "上涨家数还没压过下跌。他们写过，这种日子谈止跌太早，大手买也只是跌得慢一点。";
	const position = !decisionReady ? !quotesKnown ? "指数行情没有对齐，暂不可判断。" : "涨跌家数或跌停没有取全，暂不可判断。" : metCount >= 4 ? "右侧齐了，仍然按底仓做，不是梭哈。看对只是一半，仓位重了、成本高了、耗太久，一样会被洗出去。" : healed ? "可以试多。试多是底仓：长线不空仓，也不重仓，看周线，跌到前一个平台再加一点。看对只是一半。" : "右侧没齐。观望，或者只留手里的仓位，都是他们写过的做法。别用一两根日线把仓位打满。";
	const detail = [
		emotion ? `全市场上涨 ${emotion.up} 家、下跌 ${emotion.down} 家、跌停 ${emotion.limitDown ?? "未知"} 家。复盘里把跌停只有十来家，看成恐慌没有蔓延。` : "",
		belowLine ? `上证收在 ${fmt(sh.price, 0)}，仍低于他们写了一年多的 3800 护盘线。` : sh.price != null ? `上证收在 ${fmt(sh.price, 0)}，站回了 3800。` : "",
		gapStyle != null ? `上证和创业板差 ${fmtSigned(gapStyle)} 个点，${gapWords(gapStyle)}。创业板更弱时，他们不把它看成科技抢风头。` : "",
		gapBig != null ? `沪深300和国证2000差 ${fmtSigned(gapBig)} 个点，${gapWords(gapBig)}。原话比的是沪深300和中证2000，中证2000这条行情没有取到，小票一端用国证2000代替。` : "",
		gapForeign != null && Math.abs(gapForeign) >= .5 ? `上证和恒生科技差 ${fmtSigned(gapForeign)} 个点。他们把上证当内资、恒生科技当外资，差大了，单边就不容易持续。` : "",
		brokers?.pct != null ? `证券公司 ${fmtPct(brokers.pct)}。气氛组平时可以不动，止跌和转折时他们要涨多跌少。指数这一项${brokers.pct > 0 ? "转强了" : "还不及格"}。` : "",
		marginStreak > 0 ? `融资余额已连撤 ${marginStreak} 个交易日。杠杆哥还在走，大涨那一段还没开始。` : margin.length ? "融资余额这几天没有继续往下撤。" : "",
		indicators.bs != null ? `现货比沪深加权期货高 ${fmt(indicators.bs, 0)} 点，贴水很深。旧的 ±5 点色带已经分不出程度，不能把它看成右侧。` : "",
		downWeeks > 0 ? `上证周线连跌 ${downWeeks} 周。他们反复说，别用一两根日线给一周定性。` : ""
	].filter(Boolean).join("");
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
		nearLow
	};
}
var PATH_MODEL = "path-v1";
var LIVE_MODEL = "six-v1";
var FULL = 107;
function clamp(n, max) {
	if (!Number.isFinite(n)) return 0;
	return Math.round(Math.max(0, Math.min(max, n)) * 100) / 100;
}
function paceVolume(av, quote, now = /* @__PURE__ */ new Date()) {
	if (av == null) return {
		value: null,
		early: false,
		note: "成交没有取到"
	};
	const parts = shanghaiParts(now);
	const today = `${parts.year}-${parts.month}-${parts.day}`;
	const date = quote.date.slice(0, 10);
	const [hour = "0", minute = "0"] = quote.time.split(":");
	const mins = Number(hour) * 60 + Number(minute);
	if (!(date === today && mins >= 570 && mins < 900)) return {
		value: av,
		early: false,
		note: `两市成交 ${av.toFixed(2)} 万亿`
	};
	let elapsed = 0;
	if (mins >= 780) elapsed = 120 + Math.min(120, mins - 780);
	else if (mins >= 690) elapsed = 120;
	else elapsed = mins - 570;
	if (elapsed < 25) return {
		value: null,
		early: true,
		note: "开盘不久，成交还不作缩量判断"
	};
	const pace = Math.round(av * (240 / elapsed) * 100) / 100;
	return {
		value: pace,
		early: false,
		note: `盘中折全日约 ${pace.toFixed(2)} 万亿，已成交 ${av.toFixed(2)}`
	};
}
function clamp100(n) {
	if (!Number.isFinite(n)) return 0;
	return Math.round(Math.max(0, Math.min(100, n)) * 10) / 10;
}
function ladderPct(desk, needle) {
	return desk.ladder.find((item) => item.name.includes(needle))?.pct ?? null;
}
function pathReady(point) {
	return point.sh != null && point.hs300 != null && point.small != null && point.cyb != null;
}
function pathScore(point) {
	if (!pathReady(point)) return {
		rate: null,
		force: null
	};
	const sh = point.sh ?? 0;
	const hs = point.hs300 ?? 0;
	const sm = point.small ?? 0;
	const cy = point.cyb ?? 0;
	const gap = hs - sm;
	return {
		rate: clamp100(48 + sh * 7 + hs * 4 - Math.abs(gap) * 6 + (cy < -1 ? -6 : cy > 1 ? 4 : 0)),
		force: clamp100(52 + gap * 9 + (sh > -.3 ? 5 : -6) + (point.alla == null ? 0 : point.alla * 3))
	};
}
function volumeTone(tape) {
	const vols = tape.map((point) => point.vol).filter((n) => n != null && n > 0);
	if (vols.length < 8) return null;
	const last = vols[vols.length - 1];
	const prior = vols.slice(-21, -1);
	if (last == null || prior.length < 5) return null;
	const avg = prior.reduce((sum, n) => sum + n, 0) / prior.length;
	if (last >= avg * 1.08) return "放量";
	if (last <= avg * .92) return "缩量";
	return "平量";
}
function buildSeries(tape) {
	const rows = tape.map((point) => {
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
			mark: null
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
function scoreDesk(desk) {
	const reading = readMarket(desk);
	const { sh, cyb, hs300, hstech, indicators, brokers } = desk;
	const quoteDate = (sh.date || hs300.date || "").slice(0, 10);
	const emotion = desk.emotion && desk.emotion.date && (!quoteDate || desk.emotion.date === quoteDate) ? desk.emotion : null;
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
	const seq = [
		a50,
		hs300.pct,
		ladderPct(desk, "500"),
		ladderPct(desk, "1000"),
		gz
	].filter((n) => n != null);
	if (seq.length >= 3) {
		if (seq.every((n, i) => i === 0 || n <= seq[i - 1] + .35)) structure += 8;
		if (seq[0] >= -.3) structure += 4;
		if ((cyb.pct ?? 0) > (sh.pct ?? 0) + .6 && (a50 ?? 0) < 0) structure -= 6;
	}
	let line = 4;
	if (sh.price != null) {
		if (sh.price >= 3800) line += 12;
		else if (sh.price >= 3750) line += 6;
		else line += 2;
	}
	if (healed) line += 4;
	if (panic) line = Math.min(line, 4);
	const paced = paceVolume(indicators.av, {
		date: sh.date || hs300.date,
		time: sh.time || hs300.time
	});
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
	const dims = [
		{
			label: "赚钱效应",
			score: clamp(effect, 15),
			max: 15,
			note: known ? `上涨 ${up} / 下跌 ${down}` : "涨跌家数没有取到"
		},
		{
			label: "梯队结构",
			score: clamp(structure, 20),
			max: 20,
			note: "止跌顺序：上证50 → 沪深300 → 中证500 → 中证1000 → 国证2000"
		},
		{
			label: "护盘位置",
			score: clamp(line, 22),
			max: 22,
			note: sh.price != null ? `上证 ${sh.price.toFixed(0)}，3800 为护盘线` : "上证没有取到"
		},
		{
			label: "量能",
			score: clamp(volume, 15),
			max: 15,
			note: paced.note
		},
		{
			label: "杠杆",
			score: clamp(leverage, 15),
			max: 15,
			note: desk.margin.length ? `融资余额连降 ${reading.marginStreak} 天` : "融资没有取到"
		},
		{
			label: "周线",
			score: clamp(week, 20),
			max: 20,
			note: weeks.length ? `上证周线连跌 ${downWeeks} 周` : "周线没有取到"
		}
	];
	const points = Math.round(dims.reduce((sum, dim) => sum + dim.score, 0) * 100) / 100;
	const rate = Math.round(points / FULL * 1e4) / 100;
	let band = "观望";
	if (!known || !limitsKnown || !quotesKnown) band = "数据不足";
	else if (panic) band = "回避";
	else if (rate >= 60) band = "做多";
	else if (rate >= 40) band = "一般";
	const inst = 10 + (gap ?? 0) * 5 + ((hs300.pct ?? 0) > .8 ? 4 : 0) + ((hs300.pct ?? 0) < -1 ? -6 : 0);
	let team = 4;
	if (limitDown != null && limitDown <= 15) team += 6;
	if (limitDown != null && limitDown >= 40) team -= 6;
	if ((a50 ?? -1) >= -.3) team += 4;
	if (sh.price != null && sh.price >= 3800) team += 10;
	else if (sh.price != null && sh.price >= 3750) team += 2;
	if (forceLabel === "小维护") team += 3;
	if (forceLabel === "像一起拉") team += 6;
	const foreign = hstech.pct == null ? 0 : 6 + hstech.pct * 2.5;
	let retail = known ? ratio * 22 : 0;
	if (limitUp != null && limitUp >= 80) retail += 5;
	if (limitDown != null && limitDown >= 40) retail = Math.min(retail, 8);
	let hot = limitUp != null ? Math.min(14, limitUp / 6) : 0;
	if ((cyb.pct ?? 0) > .6) hot += 5;
	if ((brokers?.pct ?? -1) > 0) hot += 4;
	if ((cyb.pct ?? 0) < -.3) hot -= 3;
	const arms = [
		{
			key: "机构",
			label: "机构",
			score: clamp(inst, 25),
			max: 25,
			note: gap != null ? `沪深300 − 国证2000 ${gap.toFixed(2)}` : "大小票没有对齐"
		},
		{
			key: "国家队",
			label: "国家队",
			score: clamp(team, 30),
			max: 30,
			note: forceLabel
		},
		{
			key: "外资",
			label: "外资",
			score: clamp(foreign, 15),
			max: 15,
			note: hstech.pct != null ? `恒生科技 ${fmtPct(hstech.pct)}` : "恒生科技没有取到"
		},
		{
			key: "散户",
			label: "散户",
			score: clamp(retail, 31),
			max: 31,
			note: known ? `上涨占比 ${(ratio * 100).toFixed(1)}%` : "涨跌家数没有取到"
		},
		{
			key: "游资",
			label: "游资",
			score: clamp(hot, 25),
			max: 25,
			note: limitUp != null ? `涨停 ${limitUp}` : "涨停家数没有取到"
		}
	];
	const best = arms.reduce((top, arm) => arm.score / arm.max > top.score / top.max ? arm : top, arms[0]);
	if (best.score / best.max >= .72) best.label = `${best.key}主导`;
	const forceSum = Math.round(arms.reduce((sum, arm) => sum + arm.score, 0) * 100) / 100;
	const forceMax = arms.reduce((sum, arm) => sum + arm.max, 0);
	const forceRate = Math.round(forceSum / forceMax * 1e4) / 100;
	let pattern = "磨底市";
	if (panic) pattern = "恐慌市";
	else if (forceLabel === "小维护" || forceLabel === "像一起拉") pattern = "护盘市";
	else if (forceLabel === "结构不对") pattern = "错位市";
	const patternNote = panic ? "跌停在扩散" : healed ? "急跌不恐慌，等右侧信号" : "右侧信号还没有";
	let heat = "一般";
	if (panic) heat = "短期冰点";
	else if (limitUp != null && limitUp >= 90 && ratio > .65) heat = "过热";
	else if (healed && (indicators.av == null || indicators.av < 2)) heat = "不热";
	const quiet = sh.pct != null && cyb.pct != null && Math.abs(sh.pct) < .8 && Math.abs(cyb.pct) < 1.2 ? "安静" : "有波动";
	let gs = 0;
	if (limitUp != null && limitUp >= 80) gs += 4;
	if (ratio > .67) gs += 3;
	if (indicators.av != null && !paced.early && (paced.value ?? 0) >= 2.2) gs += 2;
	if ((cyb.pct ?? 0) > 2) gs += 3;
	if (panic) gs = 0;
	gs = clamp(gs, 10);
	let hsScore = 0;
	if (healed) hsScore += 4;
	if ((a50 ?? -1) >= -.3) hsScore += 3;
	if (forceLabel === "小维护" || forceLabel === "像一起拉") hsScore += 2;
	if ((sh.pct ?? -1) > -.5) hsScore += 1;
	hsScore = clamp(hsScore, 10);
	let zone = "正常区";
	if (gs >= 7) zone = "过热区";
	else if (hsScore >= 7 && gs < 4) zone = "护盘区";
	else if (panic) zone = "冰点区";
	const effectScore = dims[0]?.score ?? 0;
	const effectWord = effectScore >= 10.5 ? "偏强" : effectScore >= 6.5 ? "一般" : "偏弱";
	const active = known ? (up - down) / (up + down) * 100 : null;
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
	const mood = known ? Math.round(ratio * 1e3) / 10 : null;
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
	const retailWord = !known ? "没有涨跌家数" : retailDelta == null ? "没有取到" : retailDelta >= 5 ? "乐观" : retailDelta <= -5 ? "悲观" : "平淡";
	const met = reading.checks.filter((item) => item.met).length;
	let longPct = null;
	let shortPct = null;
	let positionNote = "关键涨跌或跌停没有取到，暂不可判断";
	const risk = !limitsKnown ? "unknown" : panic ? "triggered" : "clear";
	if (!known || !limitsKnown) positionNote = "关键涨跌或跌停没有取到，暂不可判断";
	else if (!quotesKnown) positionNote = "上证、沪深300或创业板没有行情，暂不可判断";
	else if (panic) {
		longPct = 0;
		shortPct = 0;
		positionNote = "冰点不抄";
	} else if (reading.phase === "右侧靠近" || rate >= 60 && met >= 4) {
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
	const kill = paced.early ? `开盘不久，不把成交当成缩量${brokerBit}` : desk.laggards.length === 0 ? `${volWord}，成分股跌幅没有取到${brokerBit}` : names ? `${volWord}杀权重 · ${names}${brokerBit}` : `${volWord}，权重里没有单日跌过 3% 的${brokerBit}`;
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
		headline: reading.headline
	};
}
function preferCount(primary, backup) {
	return primary ?? backup ?? null;
}
function carryWarnings(previous, next) {
	return [...previous.filter((line) => /没对上|没有取到|不参与评分|不是同一天/.test(line)), next];
}
function replayDesk(desk, day) {
	const live = (desk.sh.date || desk.hs300.date || "").slice(0, 10);
	if (!day || day === live) return {
		desk,
		historical: false
	};
	const point = desk.tape.find((row) => row.date === day);
	if (!point) {
		const quiet = (quote) => ({
			...quote,
			price: null,
			change: null,
			pct: null,
			amountYi: null,
			date: day,
			time: "15:00:00"
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
				indicators: {
					bs: null,
					uc: null,
					hk: null,
					av: null,
					cn10: null,
					futures: null,
					futuresStamp: ""
				},
				breadth: {
					tup: 0,
					tdn: 0,
					t5u: 0,
					t5d: 0,
					d50: 0,
					u05: 0,
					flat: 0,
					missing: 0,
					total: 0
				},
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
				warnings: [`${day} 的行情这一笔没对上。日期仍停在这一天，不会跳回今天。`]
			}
		};
	}
	const blank = (code, name) => ({
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
		time: "15:00:00"
	});
	const rung = (code, name, pct) => ({
		code,
		name,
		price: null,
		pct
	});
	const dayNotes = (desk.notes ?? []).filter((item) => item.day === point.date);
	const review = dayNotes.find((item) => item.kind === "review") ?? null;
	const feed = dayNotes.map((item) => ({
		title: item.title,
		link: item.link,
		summary: "",
		time: Date.parse(`${item.day}T15:00:00+08:00`),
		source: item.kind === "review" ? "像鳄鱼一样思考" : "获得信息差",
		kind: item.kind,
		tag: item.tag
	}));
	const filled = [
		"指数",
		"上证成交量",
		"融资余额"
	];
	if (point.hstech != null) filled.push("恒生科技");
	if (point.bond != null) filled.push("十年国债");
	if (point.fxClose != null) filled.push("离岸人民币");
	const missing = [];
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
			hstech: point.hstechClose != null ? priced(desk.hstech, point.hstechClose, point.hstech, point.date) : blank("HSTECH", "恒生科技"),
			fx: point.fxClose != null ? priced(desk.fx, point.fxClose, point.fx, point.date) : blank("USDCNH", "离岸人民币"),
			bond: point.bondClose != null ? priced(desk.bond, point.bondClose, point.bond, point.date) : blank("511260", "十年国债ETF"),
			indicators: {
				bs: null,
				uc: point.fxClose,
				hk: point.hstech,
				av: null,
				cn10: point.bond,
				futures: null,
				futuresStamp: ""
			},
			breadth: {
				tup: 0,
				tdn: 0,
				t5u: 0,
				t5d: 0,
				d50: 0,
				u05: 0,
				flat: 0,
				missing: 0,
				total: 0
			},
			leaders: [],
			laggards: [],
			emotion: null,
			ladder: [
				rung("000016", "上证50", point.a50),
				rung("000300", "沪深300", point.hs300),
				rung("000905", "中证500", point.zz500),
				rung("000852", "中证1000", point.small),
				rung("399303", "国证2000", point.gz)
			],
			brokers: rung("399975", "证券公司", point.brokers),
			margin: desk.margin.filter((row) => row.date <= point.date),
			author: review ? {
				title: review.title,
				link: review.link,
				verdict: "",
				excerpt: ""
			} : null,
			feed,
			boardLead: null,
			series: desk.series.filter((row) => row.date <= point.date),
			shSeries: desk.shSeries.filter((row) => row.date <= point.date),
			tape: desk.tape.filter((row) => row.date <= point.date),
			warnings: [`${point.date} 收盘回放。${filled.join("、")}按这一天的收盘。${gap}全市场涨跌家数和沪深300成分按这一天的行情另取，复盘原文不逐日给这两组数。${reviewLine}`]
		}
	};
}
function priced(base, close, pct, date) {
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
		time: "15:00:00"
	};
}
var TABS = [
	{
		id: "overview",
		label: "概览"
	},
	{
		id: "risk",
		label: "风险与仓位"
	},
	{
		id: "mood",
		label: "情绪与轮动"
	},
	{
		id: "detail",
		label: "明细"
	}
];
var LINES = [
	{
		key: "sh",
		name: "上证",
		color: "#ef5b4a"
	},
	{
		key: "alla",
		name: "全A",
		color: "#6aa7ff"
	},
	{
		key: "hs300",
		name: "沪深300",
		color: "#b388ff"
	},
	{
		key: "small",
		name: "中证1000",
		color: "#e0a24a"
	},
	{
		key: "cyb",
		name: "创业板指",
		color: "#3dcec6"
	},
	{
		key: "kc",
		name: "科创50",
		color: "#7dce6a"
	}
];
function TerminalView({ data, tab, day, pulse = 0, pending, error, onRefresh, onStealth }) {
	const navigate = useNavigate();
	const [frame, setFrame] = (0, import_react.useState)("day");
	const [dimsOpen, setDimsOpen] = (0, import_react.useState)(false);
	const [span, setSpan] = (0, import_react.useState)(null);
	const [picked, setPicked] = (0, import_react.useState)(day);
	const [brief, setBrief] = (0, import_react.useState)(null);
	const [basket, setBasket] = (0, import_react.useState)(null);
	const [basketDay, setBasketDay] = (0, import_react.useState)(null);
	const liveDate = (data.sh.date || data.hs300.date || "").slice(0, 10);
	(0, import_react.useEffect)(() => {
		setPicked(day);
	}, [day]);
	const days = (0, import_react.useMemo)(() => {
		const set = /* @__PURE__ */ new Set();
		for (const row of data.tape) if (row.date >= "2025-01-01") set.add(row.date);
		if (liveDate >= "2025-01-01") set.add(liveDate);
		if (picked) set.add(picked);
		return [...set].sort();
	}, [
		data.tape,
		liveDate,
		picked
	]);
	const selected = picked || (days.includes(liveDate) ? liveDate : days[days.length - 1] ?? "");
	const view = (0, import_react.useMemo)(() => replayDesk(data, selected && selected !== liveDate ? selected : null), [
		data,
		selected,
		liveDate
	]);
	const historical = view.historical;
	const briefFlight = (0, import_react.useRef)(null);
	const basketFlight = (0, import_react.useRef)(null);
	const selectedRef = (0, import_react.useRef)(selected);
	selectedRef.current = selected;
	(0, import_react.useEffect)(() => {
		if (!selected) return;
		const day = selected;
		setBrief((prev) => prev?.day === day ? prev : null);
		if (briefFlight.current === day) return;
		briefFlight.current = day;
		getDayBrief({ data: { day } }).then((note) => {
			if (briefFlight.current === day) briefFlight.current = null;
			if (selectedRef.current !== day) return;
			setBrief(note);
		}).catch(() => {
			if (briefFlight.current === day) briefFlight.current = null;
			if (selectedRef.current !== day) return;
			setBrief((prev) => prev?.day === day ? prev : {
				day,
				author: null,
				items: [],
				amountWanYi: null,
				stats: null,
				market: null
			});
		});
	}, [selected, pulse]);
	(0, import_react.useEffect)(() => {
		if (!historical || !selected) return;
		const day = selected;
		setBasket((prev) => prev?.day === day ? prev : null);
		setBasketDay((prev) => prev === day ? prev : null);
		if (basketFlight.current === day) return;
		if (basket?.day === day) return;
		basketFlight.current = day;
		getDayBasket({ data: { day } }).then((row) => {
			if (basketFlight.current === day) basketFlight.current = null;
			if (selectedRef.current !== day) return;
			setBasket(row);
			setBasketDay(day);
		}).catch(() => {
			if (basketFlight.current === day) basketFlight.current = null;
			if (selectedRef.current !== day) return;
			setBasketDay(day);
		});
	}, [
		historical,
		selected,
		pulse,
		basket
	]);
	const basketReady = basketDay === selected;
	const shown = (0, import_react.useMemo)(() => {
		if (!historical || !brief || brief.day !== selected) return view.desk;
		return applyBrief(view.desk, brief, basketReady ? basket : null);
	}, [
		view.desk,
		historical,
		brief,
		selected,
		basket,
		basketReady
	]);
	const briefMatch = brief?.day === selected;
	const stats = historical && briefMatch ? brief?.stats ?? null : null;
	const liveStats = !historical && briefMatch ? brief?.stats ?? null : null;
	const statsPending = historical && !briefMatch;
	const briefReady = historical && briefMatch;
	const card = (0, import_react.useMemo)(() => scoreDesk(shown), [shown]);
	const reading = (0, import_react.useMemo)(() => readMarket(shown), [shown]);
	const phase = marketPhase();
	const closed = phase.phase === "closed" || phase.phase === "weekend" || phase.phase === "lunch";
	const quoteTime = historical ? "收盘" : (data.sh.time || data.hs300.time || "").slice(0, 5) || "—";
	const longPct = card.longPct;
	const shortPct = card.shortPct;
	const cash = longPct != null && shortPct != null ? 100 - longPct - shortPct : null;
	function chooseDay(next) {
		const value = !next || next === liveDate ? void 0 : next;
		if (value === picked) return;
		setPicked(value);
		setSpan(null);
		navigate({
			to: "/",
			search: {
				tab,
				day: value
			},
			replace: true
		});
	}
	function openTab(next) {
		if (next === tab) return;
		navigate({
			to: "/",
			search: {
				tab: next,
				day
			}
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#121214] text-[#f3efe6]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "bg-gradient-to-b from-[#e23d32] to-[#c4251c]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 px-3 py-2 md:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-7 place-items-center rounded-md bg-white/15 text-sm",
						children: "鳄"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-base font-medium tracking-tight",
						children: "鳄鱼派量化系统"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-md bg-black/25 px-1.5 py-0.5 text-[11px]",
						children: "V9.3"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "relative z-30 flex flex-wrap items-center gap-1 md:ml-2",
						"aria-label": "看板分页",
						children: TABS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							search: {
								tab: item.id,
								day
							},
							"aria-current": tab === item.id ? "page" : void 0,
							onPointerDown: (event) => {
								if (event.button !== 0) return;
								openTab(item.id);
							},
							className: cn("inline-flex min-h-10 items-center rounded-full px-3.5 text-sm", tab === item.id ? "bg-white text-[#c4251c]" : "text-white/85 hover:bg-white/10"),
							children: item.label
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "ml-auto hidden text-xs text-white/85 lg:block",
						children: "点位 · 仓位 · 风险管理 三位一体 | 守株待兔 · 买预期卖事实"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2 bg-[#a51c16] px-3 py-1.5 text-xs md:px-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mod, {
						to: "/",
						label: "交易",
						day
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mod, {
						to: "/archive",
						label: "研究"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mod, {
						to: "/method",
						label: "系统"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mod, {
						to: "/breadth",
						label: "体系"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex flex-wrap items-center gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TradeDay, {
								days,
								value: selected,
								onChange: chooseDay
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => chooseDay(liveDate),
								className: cn("h-7 rounded-full px-2", historical ? "bg-black/25 text-white" : "bg-white text-[#c4251c]"),
								children: "今天"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", error ? "bg-[#e0a24a]" : "bg-[#7dce6a]") }), error ? "部分缺失" : "已连接"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-black/25 px-2 py-1",
								children: historical ? "收盘回放" : `数据 ${quoteTime}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "rounded-full bg-black/25 px-2 py-1",
								children: [historical ? shown.emotion ? "六维: 当天重算" : "六维: 数据不足" : "六维: 现算", " · 曲线: 路径分"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onRefresh,
								disabled: pending,
								className: "inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-1 disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-3", pending && "animate-spin") }), "刷新"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("rounded-full px-2 py-1", historical || closed ? "bg-white text-[#c4251c]" : "bg-black/25"),
								children: historical ? "历史收盘" : closed ? "休市缓存" : phase.label
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onStealth,
								"aria-label": "摸鱼条",
								className: "rounded-full bg-black/25 p-1.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "size-3.5" })
							})
						]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 px-3 py-3 md:px-4",
			children: [
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "rounded-lg border border-[#5a4030] bg-[#2a2118] px-3 py-2 text-sm text-[#e0c39a]",
					children: error
				}) : null,
				historical ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "rounded-lg border border-[#4a3b28] bg-[#2a2418] px-3 py-2 text-xs leading-relaxed text-[#e6d3a1]",
					children: [shown.warnings[0], shown.tape[shown.tape.length - 1]?.vol != null ? ` 上证成交量 ${shown.tape[shown.tape.length - 1]?.vol?.toFixed(2)} 亿手。` : ""]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EventBar, { data: shown }),
				historical ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReviewCard, {
					data: shown,
					pending: !briefReady,
					amount: briefReady ? brief?.amountWanYi ?? null : null
				}) : null,
				tab === "overview" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {
					data: shown,
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
					boards: stats ?? liveStats,
					statsPending,
					statsReady: briefMatch,
					basketReady
				}) : null,
				tab === "risk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Risk, {
					data: shown,
					card,
					cash,
					reading,
					historical
				}) : null,
				tab === "mood" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mood, {
					data: shown,
					card,
					stats,
					boards: stats ?? liveStats,
					ready: briefMatch
				}) : null,
				tab === "detail" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Detail, {
					data: shown,
					card,
					reading
				}) : null
			]
		})]
	});
}
function Mod({ to, label, day }) {
	const className = "rounded-full px-2 py-1 text-white/90 hover:bg-white/10";
	if (to === "/") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to: "/",
		search: {
			tab: "overview",
			day
		},
		className,
		children: label
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
		to,
		className,
		children: label
	});
}
function EventBar({ data }) {
	const chips = data.feed.filter((item) => item.link !== data.author?.link).slice(0, 3);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "flex flex-wrap items-center gap-2 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] px-3 py-2 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[#f3efe6]",
				children: "消息面事件"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[#8d877d]",
				children: ["数据 ", data.sh.date || "—"]
			}),
			data.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: data.author.link,
				target: "_blank",
				rel: "noreferrer",
				className: "max-w-full truncate rounded-full bg-[#2a2418] px-2 py-1 text-[#e6c36a]",
				title: data.author.verdict || data.author.title,
				children: ["复盘 ", data.author.verdict ? data.author.verdict.slice(0, 36) : data.author.title]
			}) : null,
			chips.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: item.link,
				target: "_blank",
				rel: "noreferrer",
				className: "max-w-[16rem] truncate rounded-full bg-[#242428] px-2 py-1 text-[#d9d3c8]",
				children: [
					item.tag,
					" ",
					item.title
				]
			}, item.link)),
			chips.length === 0 && !data.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[#8d877d]",
				children: "没有取到这一天的公开复盘"
			}) : null
		]
	});
}
function ReviewCard({ data, pending, amount }) {
	const intel = data.feed.filter((item) => item.kind === "intel" && item.link !== data.author?.link);
	const body = data.author?.excerpt || data.author?.verdict || "";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl border border-[#4a3b28] bg-[#1c1a16] px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm text-[#e6c36a]",
					children: "这一天的公众号"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "num text-[11px] text-[#8d877d]",
					children: [data.sh.date || "—", " 收盘"]
				})]
			}),
			data.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: data.author.link,
				target: "_blank",
				rel: "noreferrer",
				className: "mt-1 block text-sm text-[#f3efe6] hover:text-[#e6c36a]",
				children: data.author.title
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-[#b7b0a6]",
				children: "公开档案里没有对上这一天的复盘。"
			}),
			body ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm leading-relaxed text-[#d9d3c8]",
				children: body
			}) : data.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-[#8d877d]",
				children: pending ? "正文正在取。" : "正文没有取到，可以点标题看原文。"
			}) : null,
			amount != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "num mt-2 text-xs text-[#e6c36a]",
				children: [
					"复盘原文写两市成交 ",
					amount.toFixed(2),
					" 万亿。行情接口没有这一天的成交额。"
				]
			}) : null,
			intel.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-2",
				children: intel.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: item.link,
					target: "_blank",
					rel: "noreferrer",
					className: "text-xs text-[#d9d3c8] underline decoration-[#4a3b28] underline-offset-2",
					children: [
						item.tag,
						" · ",
						item.title
					]
				}, item.link))
			}) : null
		]
	});
}
function Overview({ data, card, cash, frame, setFrame, dimsOpen, setDimsOpen, span, setSpan, historical, reading, stats, boards, statsPending, statsReady, basketReady }) {
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
	const faceRate = historical && !scored ? sessionPoint?.rate ?? null : card.rate;
	const faceBand = historical && !scored ? "不给仓位" : card.band;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid items-start gap-3 lg:grid-cols-[280px_minmax(0,1fr)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-xs text-[#b7b0a6]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: historical && !scored ? "指数路径分" : "综合得分率" }), historical && !scored ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setDimsOpen(!dimsOpen),
							className: "text-[#8d877d]",
							children: ["六维结构 ", dimsOpen ? "收起" : "详情"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "num mt-2 text-5xl leading-none text-white",
						children: faceRate == null ? "—" : `${faceRate.toFixed(2)}%`
					}),
					historical && !scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "num mt-2 text-xs text-[#8d877d]",
						children: "指数路径分 · 40 观望 · 60 做多 · 涨跌家数还没到，先不重算六维"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "num mt-2 text-xs text-[#8d877d]",
						children: [
							"总分 ",
							card.points.toFixed(2),
							" / 可用满分 ",
							card.max.toFixed(2)
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 inline-flex rounded-full bg-[#2a241c] px-2 py-0.5 text-xs text-[#e6c36a]",
						children: faceBand
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 h-1.5 overflow-hidden rounded-full bg-[#2a2a30]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full bg-[#e23d32]",
							style: { width: `${Math.max(0, Math.min(100, faceRate ?? 0))}%` }
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "num mt-1 flex justify-between text-[10px] text-[#6f6a62]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "30" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "40" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "60" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "80" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-[11px] text-[#6f6a62]",
						children: "分区刻度 · 40 观望线 · 60 做多线"
					}),
					historical && !scored ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 border-t border-[#2c2c32] pt-2 text-[11px] leading-relaxed text-[#8d877d]",
						children: statsPending ? "这一天的涨跌家数和沪深300成分正在取。" : "这一天的涨跌家数没有取到，六维先不重算。"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [historical ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 border-t border-[#2c2c32] pt-2 text-[11px] leading-relaxed text-[#8d877d]",
						children: "按这一天的公开涨跌家数重算。分母仍是 107，不是内部权重。"
					}) : null, dimsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-3 space-y-1.5 border-t border-[#2c2c32] pt-2",
						children: [card.dims.map((dim) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-baseline justify-between gap-2 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: dim.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "num text-[#e6c36a]",
								children: [
									dim.score.toFixed(2),
									"/",
									dim.max.toFixed(0)
								]
							})]
						}, dim.label)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "pt-1 text-[11px] leading-relaxed text-[#8d877d]",
							children: "刻度和截图一致。每一维用公开行情现算，不是未公开的内部权重。"
						})]
					}) : null] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3",
				children: historical ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-[#b7b0a6]",
					children: "这一天的指数"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-2 space-y-1.5",
					children: [
						data.ladder.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: item.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", (item.pct ?? 0) > 0 ? "text-[#ef5b4a]" : (item.pct ?? 0) < 0 ? "text-[#3dcec6]" : "text-[#d9d3c8]"),
								children: fmtPct(item.pct)
							})]
						}, item.code)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: "创业板"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", (data.cyb.pct ?? 0) > 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]"),
								children: fmtPct(data.cyb.pct)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: "证券"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", (data.brokers?.pct ?? 0) > 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]"),
								children: fmtPct(data.brokers?.pct)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: "恒生科技"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", (data.hstech.pct ?? 0) > 0 ? "text-[#ef5b4a]" : data.hstech.pct == null ? "text-[#8d877d]" : "text-[#3dcec6]"),
								children: data.hstech.pct == null ? "没有这一天" : fmtPct(data.hstech.pct)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#d9d3c8]",
								children: "十年国债"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", (data.bond.pct ?? 0) > 0 ? "text-[#ef5b4a]" : data.bond.pct == null ? "text-[#8d877d]" : "text-[#3dcec6]"),
								children: data.bond.pct == null ? "没有这一天" : fmtPct(data.bond.pct)
							})]
						})
					]
				})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-[#b7b0a6]",
						children: "资金势力"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-56",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(RadarChart, {
								data: card.arms.map((arm) => ({
									...arm,
									pct: arm.score / arm.max * 100
								})),
								outerRadius: "68%",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarGrid, { stroke: "#3a3a42" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarAngleAxis, {
										dataKey: "label",
										tick: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ForceTick, { arms: card.arms })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PolarRadiusAxis, {
										domain: [0, 100],
										tick: false,
										axisLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, {
										dataKey: "pct",
										stroke: "#e6c36a",
										fill: "#e6c36a",
										fillOpacity: .35,
										isAnimationActive: false
									})
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-center text-[11px] text-[#b7b0a6]",
						children: [
							"总分 ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "num text-[#e6c36a]",
								children: card.forceRate.toFixed(2)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1",
								children: "·"
							}),
							"格局 ",
							card.pattern,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1",
								children: "·"
							}),
							card.patternNote
						]
					})
				] })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "min-w-0 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm",
						children: "得分率走势 × 关键指数"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "ml-auto flex items-center gap-1 text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFrame("intra"),
							className: cn("rounded-full px-2 py-1", frame === "intra" ? "bg-[#e23d32]" : "text-[#8d877d]"),
							children: "分时"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setFrame("day"),
							className: cn("rounded-full px-2 py-1", frame === "day" ? "bg-[#e23d32]" : "text-[#8d877d]"),
							children: "日K"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[#b7b0a6]",
							children: "时间段"
						}),
						oldest && newest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ymd, {
								value: from,
								min: oldest,
								max: newest,
								onChange: (value) => setSpan(value <= to ? {
									from: value,
									to
								} : {
									from: to,
									to: value
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[#8d877d]",
								children: "至"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ymd, {
								value: to,
								min: oldest,
								max: newest,
								onChange: (value) => setSpan(value >= from ? {
									from,
									to: value
								} : {
									from: value,
									to: from
								})
							})
						] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "hidden h-4 w-px bg-[#3a3a42] sm:inline" }),
						[
							[
								"23",
								"近23日",
								null
							],
							[
								"3m",
								"近3月",
								shiftIso(newest, -92)
							],
							[
								"1y",
								"近1年",
								shiftIso(newest, -365)
							],
							[
								"all",
								"全部",
								oldest
							]
						].map(([id, label, start]) => {
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSpan(start == null ? null : {
									from: start < oldest ? oldest : start,
									to: newest
								}),
								className: cn("h-9 rounded-full border px-2.5", (id === "23" ? span == null : span != null && start != null && from === (start < oldest ? oldest : start) && to === newest) ? "border-[#e23d32] bg-[#e23d32] text-white" : "border-[#3a3a42] text-[#d9d3c8]"),
								children: label
							}, id);
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-[11px] text-[#6f6a62]",
					children: [
						"日K · ",
						from,
						" 至 ",
						to,
						" · ",
						shown.length,
						" 个交易日",
						historical || to !== newest ? " · 整段都是指数路径分，买卖点只按这套算法" : " · 整段都是指数路径分，买卖点只按这套算法。上面的百分比是当天六维分，不回写到曲线",
						" · 全A为沪深300与中证1000等权"
					]
				}),
				frame === "intra" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "flex h-64 items-center text-sm text-[#8d877d]",
					children: "公开行情没有分时成交明细，切回日K看收盘读数。"
				}) : shown.length < 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "flex h-64 items-center text-sm text-[#8d877d]",
					children: "这段里没有足够的交易日。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
								swatch: "#c4a574",
								text: `得分率 ${last?.rate == null ? "—" : last.rate.toFixed(2)}%`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
								swatch: "#e6c36a",
								text: `资金势力 ${last?.force == null ? "—" : last.force.toFixed(2)}%`
							}),
							LINES.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Legend, {
								swatch: line.color,
								text: `${line.name} ${fmtPct(last?.[line.key] ?? null)}`
							}, line.key))
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-64",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
								data: shown,
								margin: {
									top: 12,
									right: 8,
									left: 0,
									bottom: 0
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
										stroke: "#2a2a30",
										vertical: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "date",
										minTickGap: 28,
										tickFormatter: (value) => withYear ? String(value).slice(2) : String(value).slice(5),
										tick: {
											fill: "#8d877d",
											fontSize: 10
										},
										axisLine: false,
										tickLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										yAxisId: "pct",
										tick: {
											fill: "#8d877d",
											fontSize: 10
										},
										axisLine: false,
										tickLine: false,
										width: 36,
										unit: "%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										yAxisId: "score",
										orientation: "right",
										domain: [0, 100],
										tick: {
											fill: "#8d877d",
											fontSize: 10
										},
										axisLine: false,
										tickLine: false,
										width: 32
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, { content: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartTip, {}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										yAxisId: "score",
										dataKey: "rate",
										name: "得分率",
										stroke: "#c4a574",
										strokeWidth: 2,
										dot: false,
										isAnimationActive: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										yAxisId: "score",
										dataKey: "force",
										name: "资金势力",
										stroke: "#e6c36a",
										strokeWidth: 1.6,
										dot: false,
										isAnimationActive: false
									}),
									LINES.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Line, {
										yAxisId: "pct",
										dataKey: line.key,
										name: line.name,
										stroke: line.color,
										strokeWidth: 1.2,
										dot: line.key === "sh" && shown.length <= 40 ? MarkDot : false,
										activeDot: line.key === "sh" ? false : { r: 3 },
										connectNulls: true,
										isAnimationActive: false
									}, line.key))
								]
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-14",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
								data: shown,
								margin: {
									top: 4,
									right: 40,
									left: 36,
									bottom: 0
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										dataKey: "date",
										hide: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
										hide: true,
										domain: [0, "dataMax"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
										dataKey: "vol",
										isAnimationActive: false,
										shape: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolBar, {})
									})
								]
							})
						})
					})
				] })
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mb-2 text-sm text-[#b7b0a6]",
			children: "盘面总述"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-2 text-sm leading-relaxed text-[#f3efe6]",
			children: historical ? reading.detail : card.headline
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 md:grid-cols-2 xl:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "信号面",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "短期过热判定",
							v: scored ? `${card.heat} · 涨 ${data.emotion?.up ?? 0} / 跌 ${data.emotion?.down ?? 0}` : historical ? stats ? heatLine(stats) : statsPending ? "正在取" : "涨停池没有取到" : card.heat,
							hot: scored ? card.heat === "短期冰点" || card.heat === "过热" : !historical && (card.heat === "短期冰点" || card.heat === "过热")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "主线判断",
							v: historical ? stats ? mainLine(stats) : statsPending ? "题材正在取" : "涨停题材没有取到" : card.mainShare != null ? `${card.mainName}${card.mainPct == null ? "" : ` ${fmtPct(card.mainPct)}`} · 占比 ${card.mainShare.toFixed(0)}%` : card.mainName,
							gold: !historical && card.mainShare != null || historical && Boolean(stats?.mainName)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "护盘/过热",
							v: !historical || scored ? `${card.zone} · 齐发 · GS ${card.gs.toFixed(2)}/10 · HS ${card.hs.toFixed(2)}/10` : `${data.sh.price != null ? `上证 ${data.sh.price.toFixed(0)}` : "上证没有收盘"} · ${card.quiet}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "护盘盘中",
							v: card.quiet
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "缩量杀权重",
							v: data.laggards.length > 0 || !historical ? card.kill : stats ? killLine(data, card, stats) : card.kill
						}),
						historical && data.leaders.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "沪深300领涨",
							v: data.leaders.slice(0, 2).map((row) => `${row.name} ${fmtPct(row.pct)}`).join(" · "),
							hot: true
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "资金面",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "赚钱效应",
							v: card.active != null ? `${card.effectWord} +${(card.dims[0]?.score ?? 0).toFixed(1)}/15` : historical && stats ? `封住 ${stats.limitUp} · 炸板 ${stats.broken}` : "涨跌家数没有取到",
							gold: card.active != null
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "五方势力",
							v: scored || !historical ? `${card.pattern} ${card.forceRate.toFixed(2)}` : stats ? `涨停 ${stats.limitUp}${stats.mainName ? ` · ${stats.mainName}` : ""}` : statsPending ? "正在取" : "散户家数没有，不合成一个分"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "主动性买盘",
							v: card.active == null ? historical && stats ? sealText(stats) : "涨跌家数没有取到" : `${fmtSigned(card.active, 1)}%`,
							hot: (card.active ?? 0) > 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "国家队动向",
							v: historical ? teamLine(data, card.teamMove) : card.teamMove
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "港股流动性",
							v: card.hkFlow
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "BFI 吸血/放血",
							v: card.bfi
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
					title: "情绪面",
					children: [
						historical && scored && data.emotion ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "全市场涨跌",
							v: `涨 ${data.emotion.up} / 跌 ${data.emotion.down} / 平 ${data.emotion.flat}`,
							hot: data.emotion.up > data.emotion.down
						}), data.breadth.total > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "沪深300涨跌",
							v: `涨 ${data.breadth.tup} / 跌 ${data.breadth.tdn} / 平 ${data.breadth.flat}`,
							hot: data.breadth.tup > data.breadth.tdn
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "沪深300涨跌",
							v: basketReady ? "成分涨跌没有取全" : "正在按当前成分回看这一天"
						})] }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "最高标",
							v: boards?.boards?.length ? `${boards.boards[0]?.label ?? ""} ${boards.boards[0]?.name ?? ""} · 连板 ${boards.boards.length} 只` : historical ? stats ? `${stats.highBoard ?? "没有连板"} · 涨停 ${stats.limitUp} · 炸板 ${stats.broken}` : statsPending ? "涨停池正在取" : "涨停池没有取到" : card.limitUp == null ? "涨停家数没有取到" : !statsReady ? `涨停 ${card.limitUp} 家 · 连板正在取` : `涨停 ${card.limitUp} 家 · ${boards == null ? "连板没有取到" : "这一天没有连板"}`
						}),
						boards?.boards?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardList, { boards: boards.boards }) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "涨跌情绪",
							v: card.mood != null ? `${card.mood.toFixed(1)} / 100 · ${card.moodWord}` : historical && stats ? `涨停 ${stats.limitUp} / 跌停 ${stats.limitDown}${stats.seal != null ? ` · 封板 ${(stats.seal * 100).toFixed(1)}%` : ""}` : historical ? statsPending ? "涨停池正在取" : "没有这一天的涨跌家数" : card.moodWord
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: historical ? "前一日指数冷热" : "昨恐贪",
							v: card.yestGreed == null ? card.yestWord : `${card.yestGreed.toFixed(0)} · ${card.yestWord}`
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
							k: "散户情绪",
							v: card.retailDelta == null ? historical ? statsPending ? "上涨家数正在取" : "这一天的上涨家数没有取到" : "没有涨跌家数" : `${fmtSigned(card.retailDelta, 1)} · ${card.retailWord}`,
							hot: (card.retailDelta ?? 0) > 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-[#6f6a62]",
							children: [
								"恒生科技 ",
								data.hstech.pct == null ? "没有这一天" : fmtPct(data.hstech.pct),
								" · 国债",
								" ",
								data.bond.pct == null ? "没有这一天" : fmtPct(data.bond.pct),
								" · 离岸人民币",
								" ",
								data.fx.price == null ? historical ? "这一天没有收盘" : "没有取到" : `${fmt(data.fx.price, 4)} ${fmtPct(data.fx.pct)}`
							]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					title: "仓位配比 · V2",
					children: card.longPct == null || card.shortPct == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-[#b7b0a6]",
						children: statsPending ? "涨跌家数正在取，取到之前不给仓位。" : `${card.positionNote}。`
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarRow, {
							label: "长线",
							pct: card.longPct ?? 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarRow, {
							label: "短线",
							pct: card.shortPct ?? 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "num text-xs text-[#d9d3c8]",
							children: [
								"合计 ",
								(card.longPct ?? 0) + (card.shortPct ?? 0),
								"% · 现金 ",
								cash,
								"% · 包络≤",
								(card.longPct ?? 0) + (card.shortPct ?? 0),
								"%"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-[#8d877d]",
							children: [card.positionNote, "。这是建议姿态，不是账户持仓。"]
						})
					] })
				})
			]
		})
	] })] });
}
function Risk({ data, card, cash, reading, historical }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "仓位配比 · V2",
				children: card.longPct == null || card.shortPct == null || cash == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm leading-relaxed text-[#b7b0a6]",
					children: [card.positionNote, "。"]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarRow, {
						label: "长线",
						pct: card.longPct
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BarRow, {
						label: "短线",
						pct: card.shortPct
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "num text-sm",
						children: [
							"现金 ",
							cash,
							"% · ",
							card.positionNote
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-[#b7b0a6]",
						children: reading.detail
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "右侧条件",
				children: historical && (data.emotion?.up ?? 0) + (data.emotion?.down ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-[#b7b0a6]",
					children: "右侧条件要看涨跌家数和跌停。这一天的数还没到。"
				}) : reading.checks.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: item.label,
					v: item.met ? `见到了 · ${item.detail}` : `还没有 · ${item.detail}`,
					hot: item.met
				}, item.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "磨底时钟",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm leading-relaxed text-[#d9d3c8]",
					children: reading.clock.note
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "num text-xs text-[#8d877d]",
					children: [
						"贴低点 ",
						reading.clock.nearDays ?? "—",
						" 天 · 3800 下 ",
						reading.clock.underLine ?? "—",
						" 天 · 基差 ",
						fmtSigned(data.indicators.bs)
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "融资余额",
				children: data.margin.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-[#8d877d]",
					children: "融资余额没有取到。"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "space-y-1",
					children: data.margin.slice(-6).map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex justify-between text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "num text-[#8d877d]",
								children: day.date
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "num",
								children: [day.balanceYi.toFixed(0), " 亿"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("num", day.netYi >= 0 ? "text-[#ef5b4a]" : "text-[#3dcec6]"),
								children: fmtSigned(day.netYi, 0)
							})
						]
					}, day.date))
				})
			})
		]
	});
}
function Mood({ data, card, stats, boards, ready }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "涨跌情绪",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "上涨",
						v: data.emotion ? String(data.emotion.up) : "—",
						hot: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "下跌",
						v: data.emotion ? String(data.emotion.down) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "平盘",
						v: data.emotion ? String(data.emotion.flat) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "涨停",
						v: stats ? String(stats.limitUp) : String(data.emotion?.limitUp ?? "—"),
						hot: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "跌停",
						v: stats ? String(stats.limitDown) : String(data.emotion?.limitDown ?? "—")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "涨跌情绪",
						v: data.emotion ? card.mood == null ? "—" : `${card.mood.toFixed(1)} · ${card.moodWord}` : stats ? `涨停 ${stats.limitUp} / 跌停 ${stats.limitDown}` : "没有这一天的涨跌家数"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: boards?.boards.length ? `连板个股 ${boards.boards.length} 只` : "连板个股",
				children: !ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-[#8d877d]",
					children: "连板名单正在取。"
				}) : boards?.boards.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardList, { boards: boards.boards }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-[#8d877d]",
					children: boards ? "这一天没有连板。" : "连板没有取到。"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "指数梯队",
				children: [
					data.ladder.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: item.name,
						v: fmtPct(item.pct),
						hot: (item.pct ?? 0) > 0
					}, item.code)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "创业板",
						v: fmtPct(data.cyb.pct),
						hot: (data.cyb.pct ?? 0) > 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "恒生科技",
						v: fmtPct(data.hstech.pct),
						hot: (data.hstech.pct ?? 0) > 0
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "证券",
						v: fmtPct(data.brokers?.pct),
						hot: (data.brokers?.pct ?? 0) > 0
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "沪深300领涨",
				children: data.leaders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-[#8d877d]",
					children: "这一天没有成分股回放。"
				}) : data.leaders.slice(0, 5).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: row.name,
					v: fmtPct(row.pct),
					hot: true
				}, row.code))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "沪深300领跌",
				children: data.laggards.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-[#8d877d]",
					children: "这一天没有成分股回放。"
				}) : data.laggards.slice(0, 5).map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
					k: row.name,
					v: fmtPct(row.pct)
				}, row.code))
			})
		]
	});
}
function Detail({ data, card, reading }) {
	const quotes = [
		data.sh,
		data.hs300,
		data.cyb,
		data.hstech,
		data.bond,
		data.fx
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "指数",
				children: [
					quotes.map((quote) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: quote.name,
						v: `${fmt(quote.price, quote.code === "USDCNH" ? 4 : 2)}  ${fmtPct(quote.pct)}`,
						hot: (quote.pct ?? 0) > 0
					}, quote.code)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "两市成交",
						v: data.indicators.av == null ? "—" : `${data.indicators.av.toFixed(2)} 万亿`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "十年国债",
						v: fmtPct(data.indicators.cn10, 3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "基差",
						v: fmtSigned(data.indicators.bs)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "六维怎么算",
				children: card.dims.map((dim) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-[#2c2c32] py-1.5 last:border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: dim.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num text-[#e6c36a]",
							children: [
								dim.score.toFixed(2),
								"/",
								dim.max
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[#8d877d]",
						children: dim.note
					})]
				}, dim.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				title: "五方势力",
				children: data.emotion == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [card.arms.filter((arm) => arm.key !== "散户" && arm.key !== "游资").map((arm) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-[#2c2c32] py-1.5 last:border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: arm.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num text-[#e6c36a]",
							children: [
								arm.score.toFixed(2),
								"/",
								arm.max.toFixed(2)
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[#8d877d]",
						children: arm.note
					})]
				}, arm.key)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] leading-relaxed text-[#8d877d]",
					children: "全市场涨跌家数还没取到，散户和游资先不合成。"
				})] }) : card.arms.map((arm) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b border-[#2c2c32] py-1.5 last:border-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: arm.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num text-[#e6c36a]",
							children: [
								arm.score.toFixed(2),
								"/",
								arm.max.toFixed(2)
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[#8d877d]",
						children: arm.note
					})]
				}, arm.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				title: "复盘原话",
				children: [
					data.author?.excerpt || data.author?.verdict ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[#8d877d]",
						children: "原文摘录"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed",
						children: data.author.excerpt || data.author.verdict
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed text-[#b7b0a6]",
						children: "这一天没有取到作者原文。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-[#8d877d]",
						children: "系统解读"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-relaxed",
						children: reading.headline
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs leading-relaxed text-[#8d877d]",
						children: reading.detail
					}),
					data.author ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: data.author.link,
						target: "_blank",
						rel: "noreferrer",
						className: "text-xs text-[#e6c36a]",
						children: data.author.title
					}) : null
				]
			})
		]
	});
}
function Card({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "space-y-2 rounded-xl border border-[#2c2c32] bg-[#1a1a1e] p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "text-sm text-[#f3efe6]",
			children: title
		}), children]
	});
}
function applyBrief(desk, brief, basket) {
	const next = {
		...desk,
		author: brief.author ?? desk.author,
		feed: brief.items.length > 0 ? brief.items : desk.feed
	};
	const market = brief.market;
	const hs = basket && basket.day === brief.day ? basket : null;
	if (!market && !hs) return next;
	const limitUp = preferCount(brief.stats?.limitUp, market?.limitUp);
	const limitDown = preferCount(brief.stats?.limitDown, market?.limitDown);
	return {
		...next,
		emotion: market ? {
			date: brief.day,
			up: market.up,
			down: market.down,
			flat: market.flat,
			limitUp,
			limitDown
		} : desk.emotion,
		leaders: hs?.leaders ?? [],
		laggards: hs?.laggards ?? [],
		breadth: hs ? {
			tup: hs.hsUp,
			tdn: hs.hsDown,
			t5u: 0,
			t5d: 0,
			d50: 0,
			u05: 0,
			flat: hs.hsFlat,
			missing: 0,
			total: hs.hsUp + hs.hsDown + hs.hsFlat
		} : desk.breadth,
		warnings: carryWarnings(desk.warnings, `${brief.day} 收盘回放。${market ? `全市场上涨 ${market.up}、下跌 ${market.down}` : "全市场涨跌家数没有取到"}${hs ? `，沪深300成分上涨 ${hs.hsUp}、下跌 ${hs.hsDown}` : "，沪深300成分还在回看"}。涨跌家数是全市场公开统计。沪深300按当前成分回看这一天的涨跌，不是从复盘句子里摘的。`)
	};
}
function BoardList({ boards }) {
	const groups = /* @__PURE__ */ new Map();
	for (const row of boards) {
		const list = groups.get(row.height);
		if (list) list.push(row);
		else groups.set(row.height, [row]);
	}
	const heights = [...groups.keys()].sort((a, b) => b - a);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-1",
		children: heights.map((height) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-[11px] leading-relaxed text-[#d9d3c8]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[#ef5b4a]",
					children: [height, "板"]
				}),
				" ",
				groups.get(height)?.map((row) => `${row.name} ${row.label}`).join("、")
			]
		}, height))
	});
}
function heatLine(stats) {
	const limitDown = stats.limitDown;
	const limitUp = stats.limitUp;
	return `${limitDown != null && limitDown >= 40 ? "跌停偏多" : limitUp != null && stats.broken >= limitUp && stats.broken > 0 ? "炸板偏多" : limitUp != null && limitUp >= 80 ? "涨停偏多" : "不算过热"} · 涨停 ${limitUp ?? "未知"} · 跌停 ${limitDown ?? "未知"} · 炸板 ${stats.broken}`;
}
function mainLine(stats) {
	if (!stats.mainName) return "这一天的涨停题材没有取到";
	const pct = stats.mainPct == null ? "" : ` ${fmtPct(stats.mainPct)}`;
	const ups = stats.mainUps == null ? "" : ` · 涨停 ${stats.mainUps} 家`;
	return `${stats.mainName}${pct}${ups}`;
}
function toneOf(kill) {
	if (kill.startsWith("放量")) return "放量";
	if (kill.startsWith("缩量")) return "缩量";
	if (kill.startsWith("平量")) return "平量";
	if (kill.startsWith("开盘")) return "开盘";
	return "量能";
}
function killLine(data, card, stats) {
	const names = stats.downNames.slice(0, 3).join("、");
	const broker = data.brokers?.pct == null ? "" : ` · 证券 ${fmtPct(data.brokers.pct)}`;
	return `${toneOf(card.kill)} · 跌停 ${stats.limitDown} 家${names ? ` · ${names}` : ""}${broker}`;
}
function teamLine(data, move) {
	if (move !== "看不出方向") return move;
	const a50 = data.ladder.find((item) => item.name.includes("50"))?.pct ?? null;
	const bits = [
		data.sh.pct != null ? `上证 ${fmtPct(data.sh.pct)}` : "",
		a50 != null ? `上证50 ${fmtPct(a50)}` : "",
		data.brokers?.pct != null ? `证券 ${fmtPct(data.brokers.pct)}` : ""
	].filter(Boolean);
	return bits.length ? bits.join(" · ") : move;
}
function sealText(stats) {
	return stats.seal == null ? `炸板 ${stats.broken} 家` : `封板率 ${(stats.seal * 100).toFixed(1)}% · 炸板 ${stats.broken}`;
}
function Row({ k, v, hot, gold }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "shrink-0 text-[#8d877d]",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("min-w-0 text-right", gold ? "text-[#e6c36a]" : hot ? "text-[#ef5b4a]" : "text-[#d9d3c8]"),
			children: v
		})]
	});
}
function BarRow({ label, pct }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 text-xs",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-8 text-[#8d877d]",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "h-2 flex-1 overflow-hidden rounded-full bg-[#2a2a30]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block h-full bg-[#a87888]",
					style: { width: `${pct ?? 0}%` }
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "num w-10 text-right",
				children: pct == null ? "—" : `${pct}%`
			})
		]
	});
}
function TradeDay({ days, value, onChange }) {
	if (!value || days.length === 0) return null;
	const year = value.slice(0, 4);
	const month = value.slice(5, 7);
	const day = value.slice(8, 10);
	const years = [...new Set(days.map((item) => item.slice(0, 4)))];
	const months = [...new Set(days.filter((item) => item.startsWith(year)).map((item) => item.slice(5, 7)))];
	const dates = days.filter((item) => item.startsWith(`${year}-${month}`));
	const select = "h-7 rounded-full border border-white/15 bg-black/25 px-1.5 text-white [color-scheme:dark]";
	function snap(nextYear, nextMonth, nextDay) {
		const inMonth = days.filter((item) => item.startsWith(`${nextYear}-${nextMonth}`));
		const pool = inMonth.length > 0 ? inMonth : days.filter((item) => item.startsWith(nextYear));
		if (pool.length === 0) return;
		const target = `${nextYear}-${nextMonth}-${nextDay}`;
		const picked = pool.find((item) => item === target) ?? [...pool].reverse().find((item) => item <= target) ?? pool[0];
		if (!picked || picked === value) return;
		onChange(picked);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "交易年",
				className: select,
				value: year,
				onChange: (event) => snap(event.target.value, month, day),
				children: years.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: item,
					children: [item, "年"]
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "交易月",
				className: select,
				value: month,
				onChange: (event) => snap(year, event.target.value, day),
				children: months.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: item,
					children: [item, "月"]
				}, item))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "交易日",
				className: select,
				value: dates.some((item) => item.slice(8, 10) === day) ? day : day,
				onChange: (event) => snap(year, month, event.target.value),
				children: dates.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: item.slice(8, 10),
					children: [item.slice(8, 10), "日"]
				}, item))
			})
		]
	});
}
function Legend({ swatch, text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1 text-[#d9d3c8]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "size-2 rounded-sm",
			style: { background: swatch }
		}), text]
	});
}
function ForceTick({ x = 0, y = 0, payload, arms }) {
	const arm = arms.find((item) => item.label === payload?.value);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
		x,
		y,
		textAnchor: "middle",
		fill: "#d9d3c8",
		fontSize: 11,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tspan", {
			x,
			dy: 0,
			children: payload?.value
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tspan", {
			x,
			dy: 13,
			fill: "#e6c36a",
			fontSize: 10,
			children: arm ? `${arm.score.toFixed(2)}/${arm.max.toFixed(2)}` : ""
		})]
	});
}
function shiftIso(iso, days) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
	const [y, m, d] = iso.split("-").map(Number);
	const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
	dt.setUTCDate(dt.getUTCDate() + days);
	return dt.toISOString().slice(0, 10);
}
function joinIso(y, m, d) {
	const dim = new Date(y, m, 0).getDate();
	const day = Math.min(Math.max(1, d), dim);
	return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function Ymd({ value, min, max, onChange }) {
	const [ys, ms, ds] = (value || min).split("-");
	const y = Number(ys);
	const m = Number(ms);
	const d = Number(ds);
	const y0 = Number(min.slice(0, 4));
	const y1 = Number(max.slice(0, 4));
	const years = [];
	for (let i = y0; i <= y1; i++) years.push(i);
	const m0 = y === y0 ? Number(min.slice(5, 7)) : 1;
	const m1 = y === y1 ? Number(max.slice(5, 7)) : 12;
	const months = [];
	for (let i = m0; i <= m1; i++) months.push(i);
	const dim = new Date(y, m, 0).getDate();
	let d0 = 1;
	let d1 = dim;
	if (y === y0 && m === Number(min.slice(5, 7))) d0 = Number(min.slice(8, 10));
	if (y === y1 && m === Number(max.slice(5, 7))) d1 = Math.min(d1, Number(max.slice(8, 10)));
	const days = [];
	for (let i = d0; i <= Math.max(d0, d1); i++) days.push(i);
	const select = "h-9 rounded-md border border-[#3a3a42] bg-[#121214] px-1.5 text-[#f3efe6] [color-scheme:dark]";
	function emit(ny, nm, nd) {
		let next = joinIso(ny, nm, nd);
		if (next < min) next = min;
		if (next > max) next = max;
		onChange(next);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "年",
				className: select,
				value: y,
				onChange: (event) => emit(Number(event.target.value), m, d),
				children: years.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: n,
					children: [n, "年"]
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "月",
				className: select,
				value: m,
				onChange: (event) => emit(y, Number(event.target.value), d),
				children: months.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: n,
					children: [String(n).padStart(2, "0"), "月"]
				}, n))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
				"aria-label": "日",
				className: select,
				value: Math.min(Math.max(d, d0), d1 || d0),
				onChange: (event) => emit(y, m, Number(event.target.value)),
				children: days.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
					value: n,
					children: [String(n).padStart(2, "0"), "日"]
				}, n))
			})
		]
	});
}
function MarkDot(props) {
	const { cx, cy, payload, key } = props;
	if (cx == null || cy == null || !payload?.mark) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {}, key);
	const sell = payload.mark === "卖";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
		cx,
		cy,
		r: 8,
		fill: sell ? "#1f8f5f" : "#d4533c"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
		x: cx,
		y: cy + 3,
		textAnchor: "middle",
		fontSize: 9,
		fill: "#fff",
		children: payload.mark
	})] }, key);
}
function VolBar(props) {
	const { x = 0, y = 0, width = 0, height = 0, payload } = props;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
		x,
		y,
		width: Math.max(width - 2, 1),
		height,
		fill: payload?.up ? "#ef5b4a" : "#1f8f5f"
	});
}
function ChartTip(props) {
	const { active, label, payload } = props;
	if (!active) return null;
	const date = label == null ? "" : String(label);
	const row = payload?.find((item) => item.dataKey === "rate" && item.payload)?.payload ?? payload?.find((item) => item.payload?.date === date)?.payload;
	if (!row) return null;
	const shown = date || row.date;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-[#3a3a42] bg-[#121214] px-2 py-1 text-[11px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "num text-[#8d877d]",
				children: shown
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "num",
				children: [
					"得分 ",
					row.rate == null ? "缺口" : row.rate.toFixed(1),
					" · 势力 ",
					row.force == null ? "—" : row.force.toFixed(1)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "num",
				children: ["上证 ", fmtPct(row.sh)]
			})
		]
	});
}
var STEALTH_KEY = "eyu-stealth";
function DeskView({ initial, tab, day }) {
	const [data, setData] = (0, import_react.useState)(initial);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [pulse, setPulse] = (0, import_react.useState)(0);
	const [stealth, setStealth] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setStealth(window.localStorage.getItem(STEALTH_KEY) === "1");
	}, []);
	(0, import_react.useEffect)(() => {
		let alive = true;
		const tick = async () => {
			if (document.hidden) return;
			try {
				const next = await getDesk();
				if (alive) {
					setData((prev) => keepTape(prev, next));
					setPulse((value) => value + 1);
					setError(null);
				}
			} catch {
				if (alive) setError("刷新没有成功，仍显示上一笔");
			}
		};
		const id = window.setInterval(tick, 2e4);
		return () => {
			alive = false;
			window.clearInterval(id);
		};
	}, []);
	async function refresh() {
		setPending(true);
		try {
			const next = await getDesk();
			setData((prev) => keepTape(prev, next));
			setPulse((value) => value + 1);
			setError(null);
		} catch {
			setError("刷新没有成功，仍显示上一笔");
		} finally {
			setPending(false);
		}
	}
	function toggleStealth() {
		setStealth((value) => {
			const next = !value;
			window.localStorage.setItem(STEALTH_KEY, next ? "1" : "0");
			return next;
		});
	}
	const values = {
		bs: data.indicators.bs,
		uc: data.indicators.uc,
		hk: data.indicators.hk,
		av: data.indicators.av,
		cn10: data.indicators.cn10
	};
	if (stealth) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-[#121214] px-3 py-4 text-[#f3efe6]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-3 flex justify-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: toggleStealth,
					className: "h-10 rounded-full border border-[#3a3a42] px-3 text-sm",
					children: "完整看板"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-3 text-sm leading-relaxed",
				children: readMarket(data).headline
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StealthStrip, {
				data,
				values
			}),
			error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-[#e0c39a]",
				children: error
			}) : null
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TerminalView, {
		data,
		pending,
		error: error ?? (data.warnings.length ? data.warnings.join("；") : null),
		tab,
		day,
		pulse,
		onRefresh: () => void refresh(),
		onStealth: toggleStealth
	});
}
function keepTape(prev, next) {
	if (next.tape.length > 0 || prev.tape.length === 0) return next;
	return {
		...next,
		tape: prev.tape,
		series: next.series.length > 0 ? next.series : prev.series,
		shSeries: next.shSeries.length > 0 ? next.shSeries : prev.shSeries,
		notes: next.notes.length > 0 ? next.notes : prev.notes,
		margin: next.margin.length > 0 ? next.margin : prev.margin
	};
}
function StealthStrip({ data, values }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mx-auto w-full max-w-xs rounded-3xl border border-line bg-panel p-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "num text-center text-sm text-muted",
				children: [
					data.hs300.date.slice(5) || "—",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
					data.hs300.time.slice(0, 5) || "—"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: cn("num mt-1 text-center text-xs", dirClass(data.hs300.pct)),
				children: [
					fmt(data.hs300.price),
					" ",
					fmtPct(data.hs300.pct)
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 h-px bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: ZONE_ORDER.map((key) => {
					const spec = INDICATORS[key];
					const tone = toneOf$1(key, values[key]);
					const text = key === "hk" || key === "cn10" ? fmtPct(values[key], spec.digits) : fmt(values[key], spec.digits);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: cn("num text-center text-sm", toneClass(tone)),
						title: spec.hint,
						children: [
							spec.abbr,
							":",
							text
						]
					}, key);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 h-px bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "space-y-2 text-center text-sm text-paper",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "num",
						children: ["tup:", data.breadth.tup]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "num",
						children: ["tdn:", data.breadth.tdn]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "num",
						children: ["t5u:", data.breadth.t5u]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "num",
						children: ["t5d:", data.breadth.t5d]
					})
				]
			})
		]
	});
}
function DeskPage() {
	const initial = Route$3.useLoaderData();
	const { tab, day } = Route$3.useSearch();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeskView, {
		initial,
		tab,
		day
	});
}
//#endregion
export { DeskPage as component };
