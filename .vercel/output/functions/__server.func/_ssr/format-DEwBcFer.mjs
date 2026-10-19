//#region node_modules/.nitro/vite/services/ssr/assets/format-DEwBcFer.js
function fmt(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return n.toLocaleString("zh-CN", {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
}
function fmtPct(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;
}
function fmtSigned(n, digits = 2) {
	if (n == null || !Number.isFinite(n)) return "—";
	return `${n > 0 ? "+" : ""}${n.toFixed(digits)}`;
}
function dirClass(n) {
	if (n == null || !Number.isFinite(n) || n === 0) return "text-muted";
	return n > 0 ? "text-up" : "text-down";
}
function fmtDay(ms) {
	if (!ms) return "";
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Shanghai",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(new Date(ms)).replace(/-/g, ".");
}
function fmtClockShort(ms) {
	if (!ms) return "";
	return new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Shanghai",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23"
	}).format(new Date(ms));
}
//#endregion
export { fmtPct as a, fmtDay as i, fmt as n, fmtSigned as o, fmtClockShort as r, dirClass as t };
