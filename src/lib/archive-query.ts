export type ArchiveQuery = { q: string; source: string };

export function archiveQueryReady(loaded: ArchiveQuery, current: ArchiveQuery, pending: boolean): boolean {
  return !pending && loaded.q === current.q && loaded.source === current.source;
}

export function planArchivePage(input: {
  current: ArchiveQuery;
  loaded: ArchiveQuery;
  loadedCount: number;
  pending: boolean;
}): { offset: number; allowed: boolean } {
  if (!archiveQueryReady(input.loaded, input.current, input.pending)) return { offset: 0, allowed: false };
  return { offset: input.loadedCount, allowed: true };
}

export function applyArchivePage<T>(items: T[], offset: number, page: T[]): T[] {
  return offset === 0 ? page : [...items, ...page];
}
