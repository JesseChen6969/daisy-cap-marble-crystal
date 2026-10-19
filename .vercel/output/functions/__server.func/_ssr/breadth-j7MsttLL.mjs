import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as cn, n as Route$1, s as getBreadth } from "./router-Crg4Xc9z.mjs";
import { a as fmtPct, n as fmt, r as fmtClockShort, t as dirClass } from "./format-DEwBcFer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/breadth-j7MsttLL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FILTERS = [
	{
		id: "all",
		label: "全部"
	},
	{
		id: "up",
		label: "上涨"
	},
	{
		id: "down",
		label: "下跌"
	},
	{
		id: "t5u",
		label: "涨超5%"
	},
	{
		id: "t5d",
		label: "跌超5%"
	}
];
function BreadthView({ initial }) {
	const [data, setData] = (0, import_react.useState)(initial);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [q, setQ] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(async () => {
			if (document.hidden) return;
			try {
				setData(await getBreadth());
			} catch {}
		}, 6e4);
		return () => window.clearInterval(id);
	}, []);
	async function refresh() {
		setPending(true);
		try {
			setData(await getBreadth());
		} finally {
			setPending(false);
		}
	}
	const rows = (0, import_react.useMemo)(() => {
		const query = q.trim().toLowerCase();
		return data.rows.filter((row) => {
			if (filter === "up" && !(row.pct != null && row.pct > 0)) return false;
			if (filter === "down" && !(row.pct != null && row.pct < 0)) return false;
			if (filter === "t5u" && !(row.pct != null && row.pct >= 5)) return false;
			if (filter === "t5d" && !(row.pct != null && row.pct <= -5)) return false;
			if (!query) return true;
			return row.name.toLowerCase().includes(query) || row.code.includes(query);
		}).sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999));
	}, [
		data.rows,
		filter,
		q
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-end justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-serif text-xs tracking-widest text-faint",
						children: "HS300 BREADTH"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-1 text-2xl font-medium tracking-tight",
						children: "涨跌结构"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm text-muted",
						children: [
							"上涨 ",
							data.breadth.tup,
							" · 下跌 ",
							data.breadth.tdn,
							" · 平 ",
							data.breadth.flat,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-faint",
								children: [" · ", fmtClockShort(data.asOf)]
							})
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: refresh,
					disabled: pending,
					className: "h-11 rounded-lg border border-line bg-panel-2 px-3 text-sm disabled:opacity-60",
					children: pending ? "更新中" : "刷新"
				})]
			}),
			data.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-2xl border border-line bg-panel px-4 py-3 text-sm text-warn",
				children: data.warning
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "tup 上涨",
						value: data.breadth.tup,
						className: "text-up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "tdn 下跌",
						value: data.breadth.tdn,
						className: "text-down"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "t5u 涨超5%",
						value: data.breadth.t5u,
						className: "text-up"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
						label: "t5d 跌超5%",
						value: data.breadth.t5d,
						className: "text-down"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: q,
					onChange: (event) => setQ(event.target.value),
					placeholder: "搜名称或代码",
					className: "h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm text-paper placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal sm:max-w-xs"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-2",
					children: FILTERS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-pressed": filter === item.id,
						onClick: () => setFilter(item.id),
						className: cn("h-11 rounded-full border px-3 text-sm", filter === item.id ? "border-seal text-paper" : "border-line text-muted"),
						children: item.label
					}, item.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					"显示 ",
					rows.length,
					" / ",
					data.rows.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "rounded-3xl border border-line bg-panel px-4",
				children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-8 text-sm text-muted",
					children: "没有符合的成分。"
				}) : rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, { row }, row.code))
			})
		]
	});
}
function Stat({ label, value, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-panel p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("num mt-1 text-2xl", className),
			children: value
		})]
	});
}
function Row({ row }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: "flex items-center gap-3 border-b border-line py-3 last:border-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "truncate text-sm text-paper",
					children: row.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "num text-xs text-faint",
					children: row.code
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "num text-sm text-paper",
				children: fmt(row.price)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("num w-20 text-right text-sm", dirClass(row.pct)),
				children: fmtPct(row.pct)
			})
		]
	});
}
function BreadthPage() {
	const initial = Route$1.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreadthView, { initial });
}
//#endregion
export { BreadthPage as component };
