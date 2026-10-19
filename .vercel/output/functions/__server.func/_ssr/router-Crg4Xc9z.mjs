import { i as __toESM } from "../_runtime.mjs";
import { C as require_jsx_runtime, S as useRouter, X as require_react, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, p as useRouterState, v as createFileRoute, y as createRootRoute } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as marketPhase, r as clockLabel } from "./zones-B6a6YmcZ.mjs";
import { a as Library, o as LayoutDashboard, r as Rows3, s as BookOpen, t as TriangleAlert } from "../_libs/lucide-react.mjs";
import { a as union, i as string, n as number, r as object, t as literal } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market.functions-BmIUiscL.js
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var SOURCES = [
	"all",
	"review",
	"intel",
	"report"
];
var getDesk = createServerFn({ method: "GET" }).handler(createSsrRpc("59df738ebb7c6d8891b285cd579c3a0b4ea67fa4336baf6c3a8e7164dd2f3913"));
var getDayBrief = createServerFn({ method: "GET" }).validator((input) => {
	return { day: typeof input?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : "" };
}).handler(createSsrRpc("068c487f02d216c4a1370972ec478c9ab1d70b053e6b3c5c9ec30bc69c4a89c4"));
var getDayBasket = createServerFn({ method: "GET" }).validator((input) => {
	return { day: typeof input?.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.day) ? input.day : "" };
}).handler(createSsrRpc("93e3639be5152f76ee07c1aacdcce1abe094e7a0316e9c6384f391759a55202a"));
var getBreadth = createServerFn({ method: "GET" }).handler(createSsrRpc("e9440c7667ba8989b4c2bc8267e5173a577075e05c7cee0c9f17053c5a7f7689"));
var getArchive = createServerFn({ method: "GET" }).validator((input) => {
	const raw = input ?? {};
	return {
		q: typeof raw.q === "string" ? raw.q.slice(0, 80) : "",
		source: SOURCES.includes(raw.source) ? raw.source : "all",
		limit: typeof raw.limit === "number" && Number.isFinite(raw.limit) ? Math.min(48, Math.max(12, Math.floor(raw.limit))) : 24,
		offset: typeof raw.offset === "number" && Number.isFinite(raw.offset) ? Math.max(0, Math.floor(raw.offset)) : 0
	};
}).handler(createSsrRpc("036137cac849e54bc853cabc089824e88b3876ea1cd5d1cb988b1e0504be5a53"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Crg4Xc9z.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";
function errorMessage(error) {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === "string" && error) return error;
	return FALLBACK_MESSAGE;
}
function AppErrorComponent({ error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
					className: "size-10",
					strokeWidth: 2
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-lg font-semibold",
				children: "Something went wrong"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-md text-sm break-words text-zinc-500 dark:text-zinc-400",
				children: errorMessage(error)
			})
		]
	});
}
/**
* Path-based preview hosts serve the dev server under `/{port_id}/` and strip
* that prefix before forwarding, so SSR sees `/` while the browser URL keeps the
* prefix. TanStack Start resets `basepath` on hydration, so a `rewrite` keeps
* client routing and generated links aligned with the public URL.
*/
var PATH_BASED_PREVIEW_HOSTS = /* @__PURE__ */ new Set([
	"preview.grok.genai.mil",
	"preview.grok.mil",
	"preview.grokgsac.com"
]);
var PORT_ID_PREFIX = /^\/hds-[a-z0-9]+-\d+-[a-z0-9]+(?=\/|$)/i;
function previewPathPrefix(hostname, pathname) {
	if (!PATH_BASED_PREVIEW_HOSTS.has(hostname.toLowerCase())) return void 0;
	return PORT_ID_PREFIX.exec(pathname)?.[0];
}
function prefixRewrite(prefix) {
	return {
		input: ({ url }) => {
			if (url.pathname === prefix) url.pathname = "/";
			else if (url.pathname.startsWith(`${prefix}/`)) url.pathname = url.pathname.slice(prefix.length);
			return url;
		},
		output: ({ url }) => {
			url.pathname = `${prefix}${url.pathname}`;
			return url;
		}
	};
}
function previewPathRewrite() {
	if (typeof window === "undefined") return void 0;
	const prefix = previewPathPrefix(window.location.hostname, window.location.pathname);
	return prefix ? prefixRewrite(prefix) : void 0;
}
/**
* App-wide client provider mounted once near the root (in `src/routes/__root.tsx`):
*
*   <AuthProvider><Outlet /></AuthProvider>
*
* Better Auth's React client (`@/lib/auth/client`) needs NO context provider —
* its `useSession()` works standalone — so this is a passthrough today. It's
* kept as the single, stable mount point for any future client-side providers
* (e.g. a toast or theme provider) without churning the root shell.
*/
function AuthProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children });
}
var CONNECTOR_TOKEN_READY_EVENT = "grok:connector-token-ready";
function isGrokEmbedderOrigin(origin) {
	try {
		const url = new URL(origin);
		if (url.protocol !== "https:" && url.protocol !== "http:") return false;
		const host = url.hostname.toLowerCase();
		if (host === "grok.com" || host.endsWith(".grok.com")) return true;
		if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
		return false;
	} catch {
		return false;
	}
}
function isSandboxPreviewGuestHost(hostname) {
	const host = hostname.toLowerCase();
	return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}
function isRemintPreviewPair(guestHost, parentHost) {
	const guest = guestHost.toLowerCase();
	const parent = parentHost.toLowerCase();
	const i = guest.indexOf(".preview.");
	if (i <= 0) return false;
	const label = guest.slice(0, i);
	const rest = guest.slice(i + 9);
	if (label.includes(".") || !rest.includes(".")) return false;
	return parent === rest || parent === `grok.${rest}`;
}
function resolveParentEmbedderOrigin(parentIsSelf, referrer, ancestorOrigin, guestHostname = "") {
	if (parentIsSelf) return null;
	for (const candidate of [referrer, ancestorOrigin ?? ""].filter(Boolean)) try {
		const url = new URL(candidate.includes("://") ? candidate : `https://${candidate}`);
		if (url.protocol !== "https:" && url.protocol !== "http:") continue;
		if (isGrokEmbedderOrigin(url.origin)) return url.origin;
		if (isSandboxPreviewGuestHost(guestHostname) || isRemintPreviewPair(guestHostname, url.hostname)) return url.origin;
	} catch {}
	return null;
}
/**
* Guest side of the grok-web ↔ sandbox preview postMessage bridge.
*
* Activates only when this page is framed by an allowlisted Grok embedder.
* Top-level runs (download/export, local `npm run dev`, deployed sites) noop.
*/
var PREVIEW_BRIDGE_CHANNEL = "grok-preview-bridge";
var EnvelopeSchema = object({
	channel: literal(PREVIEW_BRIDGE_CHANNEL),
	version: number().int().positive(),
	type: string().min(1)
});
var HelloSchema = EnvelopeSchema.extend({ type: literal("hello") });
var NavigateSchema = EnvelopeSchema.extend({
	type: literal("navigate"),
	path: string().min(1)
});
var HistorySchema = EnvelopeSchema.extend({
	type: literal("history"),
	delta: union([literal(-1), literal(1)])
});
var ConnectorTokenReadySchema = EnvelopeSchema.extend({ type: literal("connector-token-ready") });
function isSafeBridgePath(path) {
	if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return false;
	try {
		return new URL(path, "https://preview.invalid").origin === "https://preview.invalid";
	} catch {
		return false;
	}
}
/**
* Origin of the Grok embedder framing this page, or null when the page runs
* top-level (download/export, local `npm run dev`, deployed sites) or under a
* non-Grok parent. Client-only; null during SSR.
*/
function resolveCurrentEmbedderOrigin() {
	if (typeof window === "undefined") return null;
	const ancestorOrigin = typeof location.ancestorOrigins !== "undefined" && location.ancestorOrigins.length > 0 ? location.ancestorOrigins[0] : null;
	return resolveParentEmbedderOrigin(window.parent === window, document.referrer, ancestorOrigin, window.location.hostname);
}
/**
* Install host↔guest messaging. Returns a dispose function.
* Noops (returns a no-op dispose) when not embedded under a Grok parent.
*/
function installPreviewHostBridge(options = {}) {
	const parentOrigin = resolveCurrentEmbedderOrigin();
	if (parentOrigin === null) return () => {};
	const ROOT_STATE_KEY = "__grokPreviewBridgeRoot";
	const originalPushState = window.history.pushState.bind(window.history);
	const originalReplaceState = window.history.replaceState.bind(window.history);
	const isAtHistoryRoot = () => {
		const state = window.history.state;
		return Boolean(state && typeof state === "object" && state[ROOT_STATE_KEY] === true);
	};
	try {
		const current = window.history.state;
		if (!(current !== null && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, ROOT_STATE_KEY))) {
			const isRoot = window.history.length <= 1;
			originalReplaceState(current && typeof current === "object" ? {
				...current,
				[ROOT_STATE_KEY]: isRoot
			} : { [ROOT_STATE_KEY]: isRoot }, "", window.location.href);
		}
	} catch {}
	const post = (message) => {
		window.parent.postMessage(message, parentOrigin);
	};
	const reportLocation = () => {
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "location",
			path: window.location.pathname || "/",
			search: window.location.search,
			hash: window.location.hash
		});
	};
	const reportRoutes = () => {
		const paths = options.getRoutePaths?.() ?? [];
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "routes",
			paths
		});
	};
	const defaultNavigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		try {
			const url = new URL(path, window.location.origin);
			if (url.origin !== window.location.origin) return;
			const next = `${url.pathname}${url.search}${url.hash}`;
			window.history.pushState(window.history.state, "", next);
			window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
		} catch {}
	};
	const navigate = (path) => {
		if (!isSafeBridgePath(path)) return;
		if (options.navigate) {
			options.navigate(path);
			return;
		}
		defaultNavigate(path);
	};
	const announce = () => {
		reportLocation();
		reportRoutes();
		post({
			channel: PREVIEW_BRIDGE_CHANNEL,
			version: 1,
			type: "ready"
		});
	};
	const onHello = (data) => {
		if (!HelloSchema.safeParse(data).success) return;
		announce();
	};
	const onNavigate = (data) => {
		const parsed = NavigateSchema.safeParse(data);
		if (!parsed.success) return;
		navigate(parsed.data.path);
		queueMicrotask(reportLocation);
	};
	const onHistory = (data) => {
		const parsed = HistorySchema.safeParse(data);
		if (!parsed.success) return;
		if (parsed.data.delta === -1 && isAtHistoryRoot()) return;
		window.history.go(parsed.data.delta);
	};
	const onConnectorTokenReady = (data) => {
		if (!ConnectorTokenReadySchema.safeParse(data).success) return;
		window.dispatchEvent(new Event(CONNECTOR_TOKEN_READY_EVENT));
	};
	const hostMessageHandlers = /* @__PURE__ */ new Map([
		["hello", onHello],
		["navigate", onNavigate],
		["history", onHistory],
		["connector-token-ready", onConnectorTokenReady]
	]);
	const onMessage = (event) => {
		if (event.source !== window.parent) return;
		if (event.origin !== parentOrigin) return;
		const envelope = EnvelopeSchema.safeParse(event.data);
		if (!envelope.success || envelope.data.version !== 1) return;
		hostMessageHandlers.get(envelope.data.type)?.(event.data);
	};
	const onPopState = () => {
		reportLocation();
	};
	const onHashChange = () => {
		reportLocation();
	};
	window.history.pushState = (data, unused, url) => {
		const next = data && typeof data === "object" ? {
			...data,
			[ROOT_STATE_KEY]: false
		} : data;
		originalPushState(next, unused, url);
		reportLocation();
	};
	window.history.replaceState = (data, unused, url) => {
		const next = isAtHistoryRoot() ? {
			...data && typeof data === "object" ? data : {},
			[ROOT_STATE_KEY]: true
		} : data;
		originalReplaceState(next, unused, url);
		reportLocation();
	};
	window.addEventListener("message", onMessage);
	window.addEventListener("popstate", onPopState);
	window.addEventListener("hashchange", onHashChange);
	announce();
	return () => {
		window.removeEventListener("message", onMessage);
		window.removeEventListener("popstate", onPopState);
		window.removeEventListener("hashchange", onHashChange);
		window.history.pushState = originalPushState;
		window.history.replaceState = originalReplaceState;
	};
}
/** Collect static path patterns from a TanStack route tree (best-effort). */
function collectRoutePathsFromTree(routeTree) {
	const paths = /* @__PURE__ */ new Set();
	const walk = (node) => {
		if (!node || typeof node !== "object") return;
		const record = node;
		const full = typeof record.fullPath === "string" ? record.fullPath : typeof record.path === "string" ? record.path : null;
		if (full !== null && full !== "") paths.add(full.startsWith("/") ? full : `/${full}`);
		else if (full === "") paths.add("/");
		const children = record.children;
		if (Array.isArray(children)) for (const child of children) walk(child);
		else if (children && typeof children === "object") for (const child of Object.values(children)) walk(child);
	};
	walk(routeTree);
	return [...paths];
}
/**
* Mount once in `__root.tsx` so the Grok preview chrome can drive navigation
* (and later receive registered routes). Noops when the app is not embedded.
*/
function PreviewHostBridge() {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		return installPreviewHostBridge({
			navigate: (path) => {
				router.history.push(path);
			},
			getRoutePaths: () => collectRoutePathsFromTree(router.routeTree)
		});
	}, [router]);
	return null;
}
var NAV = [
	{
		to: "/",
		label: "盘面",
		icon: LayoutDashboard
	},
	{
		to: "/breadth",
		label: "涨跌",
		icon: Rows3
	},
	{
		to: "/archive",
		label: "档案",
		icon: Library
	},
	{
		to: "/method",
		label: "口径",
		icon: BookOpen
	}
];
function Shell({ children }) {
	const path = useRouterState({ select: (state) => state.location.pathname });
	const [now, setNow] = (0, import_react.useState)(() => /* @__PURE__ */ new Date());
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setNow(/* @__PURE__ */ new Date()), 1e3);
		return () => window.clearInterval(id);
	}, []);
	const phase = marketPhase(now);
	const home = path === "/";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: home ? "min-h-screen bg-[#121214]" : "min-h-screen",
		children: [
			home ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-header bg-header text-paper",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 md:px-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							search: {
								tab: "overview",
								day: void 0
							},
							className: "flex min-w-0 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-8 shrink-0 place-items-center bg-ink text-sm leading-none text-paper",
								children: "鳄"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate text-sm font-medium tracking-tight",
									children: "鳄鱼派看盘"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden text-xs text-paper/70 sm:block",
									children: "公开行情对照复盘读法"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
							className: "ml-4 hidden items-center gap-1 md:flex",
							children: NAV.map((item) => {
								const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: item.to,
									className: cn("rounded-full px-3 py-1.5 text-sm", active ? "bg-ink text-paper" : "text-paper/80 hover:bg-ink/30"),
									children: item.label
								}, item.to);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("time", {
							className: "num ml-auto shrink-0 text-right text-xs text-paper/80",
							suppressHydrationWarning: true,
							children: [
								phase.label,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mx-1 text-paper/40",
									children: "·"
								}),
								clockLabel(now)
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: home ? "" : "mx-auto max-w-7xl px-3 pt-3 pb-24 md:px-4 md:pb-10",
				children
			}),
			home ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "grid grid-cols-4 pb-[env(safe-area-inset-bottom)]",
					children: NAV.map((item) => {
						const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.to,
							className: cn("flex h-14 flex-col items-center justify-center gap-1 text-xs", active ? "text-paper" : "text-faint"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								strokeWidth: 1.75
							}), item.label]
						}) }, item.to);
					})
				})
			})
		]
	});
}
var styles_default = "/assets/styles-i-VXH6wJ.css";
var Route$4 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "鳄鱼派看盘" },
			{
				name: "description",
				content: "鳄鱼派指标盯盘与投资档案：基差、汇率、恒生科技、成交额、沪深300涨跌结构，以及每日复盘。"
			},
			{
				name: "theme-color",
				content: "#100e0c"
			}
		],
		links: [
			{
				rel: "icon",
				type: "image/svg+xml",
				href: "/favicon.svg"
			},
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "manifest",
				href: "/__grok/manifest.webmanifest"
			},
			{
				rel: "apple-touch-icon",
				href: "/__grok/icon-180.png"
			}
		]
	}),
	component: () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "zh-CN",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreviewHostBridge, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
		] })]
	})
});
function parseDeskTab(value) {
	if (value === "risk" || value === "mood" || value === "detail") return value;
	return "overview";
}
function parseDeskDay(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return void 0;
	return value;
}
var $$splitComponentImporter$3 = () => import("./routes-ARA6xmDO.mjs");
var Route$3 = createFileRoute("/")({
	validateSearch: (search) => ({
		tab: parseDeskTab(search.tab),
		day: parseDeskDay(search.day)
	}),
	loaderDeps: () => ({}),
	loader: () => getDesk(),
	head: () => ({ meta: [{ title: "鳄鱼派量化系统" }] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./archive-hmRcHFmp.mjs");
var Route$2 = createFileRoute("/archive")({
	loader: () => getArchive({ data: {
		q: "",
		source: "all",
		limit: 24
	} }),
	head: () => ({ meta: [{ title: "档案 · 鳄鱼派看盘" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./breadth-j7MsttLL.mjs");
var Route$1 = createFileRoute("/breadth")({
	loader: () => getBreadth(),
	head: () => ({ meta: [{ title: "涨跌 · 鳄鱼派看盘" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./method-BjeBFEhn.mjs");
var Route = createFileRoute("/method")({
	head: () => ({ meta: [{ title: "口径 · 鳄鱼派看盘" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$3.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$4
	}),
	ArchiveRoute: Route$2.update({
		id: "/archive",
		path: "/archive",
		getParentRoute: () => Route$4
	}),
	BreadthRoute: Route$1.update({
		id: "/breadth",
		path: "/breadth",
		getParentRoute: () => Route$4
	}),
	MethodRoute: Route.update({
		id: "/method",
		path: "/method",
		getParentRoute: () => Route$4
	})
};
var routeTree = Route$4._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		rewrite: previewPathRewrite(),
		defaultErrorComponent: AppErrorComponent
	});
}
//#endregion
export { cn as a, getDayBasket as c, Route$3 as i, getDayBrief as l, Route$1 as n, getArchive as o, Route$2 as r, getBreadth as s, router_exports as t, getDesk as u };
