import { useEffect, useRef, useState } from "react";
import { getArchive } from "@/lib/market.functions";
import type { ArchivePayload, ArchiveSource } from "@/lib/market.types";
import { cn } from "@/lib/cn";
import { fmtDay } from "@/lib/format";

const TABS: { id: ArchiveSource; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "review", label: "每日复盘" },
  { id: "intel", label: "每日信息" },
  { id: "report", label: "历史研报" },
];

export function ArchiveView({ initial }: { initial: ArchivePayload }) {
  const [q, setQ] = useState("");
  const [source, setSource] = useState<ArchiveSource>("all");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState(initial.items);
  const [matched, setMatched] = useState(initial.matched);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [counts, setCounts] = useState(initial.counts);
  const [warning, setWarning] = useState(initial.warning);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let alive = true;
    const timer = window.setTimeout(() => {
      setPending(true);
      getArchive({ data: { q, source, limit: 24, offset } })
        .then((next) => {
          if (!alive) return;
          setItems((prev) => (offset === 0 ? next.items : [...prev, ...next.items]));
          setMatched(next.matched);
          setHasMore(next.hasMore);
          setCounts(next.counts);
          setWarning(next.warning);
          setError(null);
        })
        .catch(() => {
          if (alive) setError("检索没有成功");
        })
        .finally(() => {
          if (alive) setPending(false);
        });
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [q, source, offset]);

  const countLabel =
    source === "review"
      ? counts.review
      : source === "intel"
        ? counts.intel
        : source === "report"
          ? counts.report
          : counts.all;

  return (
    <div className="space-y-4">
      <div>
        <p className="font-serif text-xs tracking-widest text-faint">GATOR ARCHIVE</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">投资档案</h1>
        <p className="mt-1 max-w-xl text-sm text-muted">
          获得信息差、像鳄鱼一样思考，以及历史研报。正文留在鳄鱼派投资档案，这里做检索和跳转。
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Count label="全部" value={counts.all} />
        <Count label="每日复盘" value={counts.review} />
        <Count label="每日信息" value={counts.intel} />
        <Count label="历史研报" value={counts.report} />
      </dl>

      <input
        value={q}
        onChange={(event) => {
          setOffset(0);
          setQ(event.target.value);
        }}
        placeholder="搜标题或摘要"
        className="h-11 w-full rounded-lg border border-line bg-ink px-3 text-sm placeholder:text-faint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
      />

      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={source === tab.id}
            onClick={() => {
              setOffset(0);
              setSource(tab.id);
            }}
            className={cn(
              "h-11 rounded-full border px-3 text-sm",
              source === tab.id ? "border-seal text-paper" : "border-line text-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-faint">
        {pending ? "检索中" : `匹配 ${matched}`}
        {countLabel ? ` · 本类 ${countLabel}` : ""}
      </p>
      {error || warning ? <p className="text-sm text-warn">{error ?? warning}</p> : null}

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="rounded-3xl border border-line bg-panel px-4 py-8 text-sm text-muted">没有匹配的条目。</li>
        ) : (
          items.map((item) => (
            <li key={item.link}>
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="block rounded-3xl border border-line bg-panel p-4 transition-colors duration-150 hover:border-faint"
              >
                <p className="text-xs text-faint">
                  {item.tag}
                  <span className="num"> · {fmtDay(item.time)}</span>
                </p>
                <p className="mt-1 text-base text-paper">{item.title}</p>
                {item.summary && item.summary !== item.tag ? (
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{item.summary}</p>
                ) : null}
              </a>
            </li>
          ))
        )}
      </ul>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setOffset(items.length)}
          className="h-11 w-full rounded-lg border border-line text-sm text-muted"
        >
          再显示一些
        </button>
      ) : null}

      <p className="text-xs text-faint">
        原文在{" "}
        <a className="text-muted underline" href="https://gator.ronchy2000.top/" target="_blank" rel="noreferrer">
          鳄鱼派投资档案
        </a>
        。
      </p>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="num mt-1 text-xl text-paper">{value || "—"}</dd>
    </div>
  );
}
