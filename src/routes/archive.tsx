import { createFileRoute } from "@tanstack/react-router";
import { ArchiveView } from "@/components/archive-view";
import { getArchive } from "@/lib/market.functions";

export const Route = createFileRoute("/archive")({
  loader: () => getArchive({ data: { q: "", source: "all", limit: 24 } }),
  head: () => ({ meta: [{ title: "档案 · 鳄鱼派看盘" }] }),
  component: ArchivePage,
});

function ArchivePage() {
  const initial = Route.useLoaderData();
  return <ArchiveView initial={initial} />;
}
