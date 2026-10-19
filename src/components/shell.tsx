import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, Library, Rows3 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { clockLabel, marketPhase } from "@/lib/zones";

const NAV = [
  { to: "/", label: "盘面", icon: LayoutDashboard },
  { to: "/breadth", label: "涨跌", icon: Rows3 },
  { to: "/archive", label: "档案", icon: Library },
  { to: "/method", label: "口径", icon: BookOpen },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const phase = marketPhase(now);

  const home = path === "/";

  return (
    <div className={home ? "min-h-screen bg-[#121214]" : "min-h-screen"}>
      {home ? null : (
      <header className="sticky top-0 z-20 border-b border-header bg-header text-paper">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 md:px-4">
          <Link to="/" search={{ tab: "overview", day: undefined }} className="flex min-w-0 items-center gap-2">
            <span className="grid size-8 shrink-0 place-items-center bg-ink text-sm leading-none text-paper">
              鳄
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium tracking-tight">鳄鱼派看盘</span>
              <span className="hidden text-xs text-paper/70 sm:block">公开行情对照复盘读法</span>
            </span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm",
                    active ? "bg-ink text-paper" : "text-paper/80 hover:bg-ink/30",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <time
            className="num ml-auto shrink-0 text-right text-xs text-paper/80"
            suppressHydrationWarning
          >
            {phase.label}
            <span className="mx-1 text-paper/40">·</span>
            {clockLabel(now)}
          </time>
        </div>
      </header>
      )}
      <main className={home ? "" : "mx-auto max-w-7xl px-3 pt-3 pb-24 md:px-4 md:pb-10"}>{children}</main>
      {home ? null : (
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ink md:hidden">
        <ul className="grid grid-cols-4 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const active = item.to === "/" ? path === "/" : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-xs",
                    active ? "text-paper" : "text-faint",
                  )}
                >
                  <Icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      )}
    </div>
  );
}
