import { createFileRoute } from "@tanstack/react-router";
import { BreadthView } from "@/components/breadth-view";
import { getBreadth } from "@/lib/market.functions";

export const Route = createFileRoute("/breadth")({
  loader: () => getBreadth(),
  head: () => ({ meta: [{ title: "涨跌 · 鳄鱼派看盘" }] }),
  component: BreadthPage,
});

function BreadthPage() {
  const initial = Route.useLoaderData();
  return <BreadthView initial={initial} />;
}
