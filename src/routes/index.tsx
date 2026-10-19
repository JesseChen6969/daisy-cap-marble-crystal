import { createFileRoute } from "@tanstack/react-router";
import { DeskView } from "@/components/desk-view";
import { parseDeskDay, parseDeskTab } from "@/lib/desk-tab";
import { getDesk } from "@/lib/market.functions";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: parseDeskTab(search.tab),
    day: parseDeskDay(search.day),
  }),
  loaderDeps: () => ({}),
  loader: () => getDesk(),
  head: () => ({ meta: [{ title: "鳄鱼派量化系统" }] }),
  component: DeskPage,
});

function DeskPage() {
  const initial = Route.useLoaderData();
  const { tab, day } = Route.useSearch();
  return <DeskView initial={initial} tab={tab} day={day} />;
}
