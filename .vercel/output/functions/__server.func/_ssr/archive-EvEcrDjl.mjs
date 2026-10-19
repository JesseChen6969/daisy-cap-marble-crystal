import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { f as cn, p as getArchive, r as Route$2 } from "./router-l1efmoVl.mjs";
import { i as fmtDay } from "./format-DEwBcFer.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/archive-EvEcrDjl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		id: "all",
		label: "全部"
	},
	{
		id: "review",
		label: "每日复盘"
	},
	{
		id: "intel",
		label: "每日信息"
	},
	{
		id: "report",
		label: "历史研报"
	}
];
function ArchiveView({ initial }) {
	const [q, setQ] = (0, import_react.useState)("");
	const [source, setSource] = (0, import_react.useState)("all");
	const [limit, setLimit] = (0, import_react.useState)(24);
	const [data, setData] = (0, import_react.useState)(initial);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const first = (0, import_react.useRef)(true);
	(0, import_react.useEffect)(() => {
		if (first.current) {
			first.current = false;
			return;
		}
		let alive = true;
		const timer = window.setTimeout(() => {
			setPending(true);
			getArchive({ data: {
				q,
				source,
				limit
			} }).then((next) => {
				if (!alive) return;
				setData(next);
				setError(null);
			}).catch(() => {
				if (alive) setError("检索没有成功");
			}).finally(() => {
				if (alive) setPending(false);
			});
		}, 220);
		return () => {
			alive = false;
			window.clearTimeout(timer);
		};
	}, [
		q,
		source,
		limit
	]);
	const countLabel = source === "review" ? data.counts.review : source === "intel" ? data.counts.intel : source === "report" ? data.counts.report : data.counts.all;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-serif text-xs tracking-widest text-faint",
					children: "GATOR ARCHIVE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-1 text-2xl font-medium tracking-tight",
					children: "投资档案"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 max-w-xl text-sm text-muted",
					children: "获得信息差、像鳄鱼一样思考，以及历史研报。正文留在鳄鱼派投资档案，这里做检索和跳转。"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
						label: "全部",
						value: data.counts.all
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
						label: "每日复盘",
						value: data.counts.review
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
						label: "每日信息",
						value: data.counts.intel
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Count, {
						label: "历史研报",
						value: data.counts.report
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value: q,
				onChange: (event) => {
					setLimit(24);
					setQ(event.target.value);
				},
				placeholder: "搜标题或摘要",
				className: "h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: TABS.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-pressed": source === tab.id,
					onClick: () => {
						setLimit(24);
						setSource(tab.id);
					},
					className: cn("h-11 rounded-full border px-3 text-sm", source === tab.id ? "border-seal text-paper" : "border-line text-muted"),
					children: tab.label
				}, tab.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [pending ? "检索中" : `匹配 ${data.matched}`, countLabel ? ` · 本类 ${countLabel}` : ""]
			}),
			error || data.warning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-warn",
				children: error ?? data.warning
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-3",
				children: data.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "rounded-3xl border border-line bg-panel px-4 py-8 text-sm text-muted",
					children: "没有匹配的条目。"
				}) : data.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
					href: item.link,
					target: "_blank",
					rel: "noreferrer",
					className: "block rounded-3xl border border-line bg-panel p-4 transition-colors duration-150 hover:border-faint",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-faint",
							children: [item.tag, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "num",
								children: [" · ", fmtDay(item.time)]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-base text-paper",
							children: item.title
						}),
						item.summary && item.summary !== item.tag ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 line-clamp-2 text-sm text-muted",
							children: item.summary
						}) : null
					]
				}) }, item.link))
			}),
			data.matched > data.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setLimit((value) => Math.min(120, value + 24)),
				className: "h-11 w-full rounded-lg border border-line text-sm text-muted",
				children: "再显示一些"
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-faint",
				children: [
					"原文在",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "text-muted underline",
						href: "https://gator.ronchy2000.top/",
						target: "_blank",
						rel: "noreferrer",
						children: "鳄鱼派投资档案"
					}),
					"。"
				]
			})
		]
	});
}
function Count({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-2xl border border-line bg-panel p-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-xs text-faint",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "num mt-1 text-xl text-paper",
			children: value || "—"
		})]
	});
}
function ArchivePage() {
	const initial = Route$2.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveView, { initial });
}
//#endregion
export { ArchivePage as component };
