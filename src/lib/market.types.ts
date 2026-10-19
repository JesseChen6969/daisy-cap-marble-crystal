export type Quote = {
  code: string;
  name: string;
  price: number | null;
  change: number | null;
  pct: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prev: number | null;
  amountYi: number | null;
  date: string;
  time: string;
};

export type ComponentRow = {
  code: string;
  name: string;
  price: number | null;
  pct: number | null;
};

export type Bar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type Breadth = {
  tup: number;
  tdn: number;
  t5u: number;
  t5d: number;
  d50: number;
  u05: number;
  flat: number;
  missing: number;
  total: number;
};

export type Indicators = {
  bs: number | null;
  uc: number | null;
  hk: number | null;
  av: number | null;
  cn10: number | null;
  futures: number | null;
  futuresStamp: string;
};

export type Emotion = {
  date: string;
  up: number;
  down: number;
  flat: number;
  limitUp: number | null;
  limitDown: number | null;
};

export type LadderQuote = {
  code: string;
  name: string;
  price: number | null;
  pct: number | null;
};

export type MarginDay = {
  date: string;
  balanceYi: number;
  netYi: number;
};

export type AuthorNote = {
  title: string;
  link: string;
  verdict: string;
  excerpt: string;
};

export type DayRef = {
  day: string;
  title: string;
  link: string;
  kind: ArchiveKind;
  tag: string;
};

export type DayBoard = {
  name: string;
  label: string;
  height: number;
};

export type DayStats = {
  limitUp: number | null;
  limitDown: number | null;
  broken: number;
  seal: number | null;
  highBoard: string | null;
  mainName: string | null;
  mainPct: number | null;
  mainUps: number | null;
  downNames: string[];
  boards: DayBoard[];
};

export type DayBasket = {
  day: string;
  hsUp: number;
  hsDown: number;
  hsFlat: number;
  leaders: ComponentRow[];
  laggards: ComponentRow[];
};

export type DayMarket = {
  up: number;
  down: number;
  flat: number;
  limitUp: number | null;
  limitDown: number | null;
  hsUp: number | null;
  hsDown: number | null;
  hsFlat: number | null;
  leaders: ComponentRow[];
  laggards: ComponentRow[];
};

export type DayBrief = {
  day: string;
  author: AuthorNote | null;
  items: ArchiveItem[];
  amountWanYi: number | null;
  stats: DayStats | null;
  market: DayMarket | null;
};

export type ArchiveKind = "review" | "intel" | "report" | "other";

export type ArchiveItem = {
  title: string;
  link: string;
  summary: string;
  time: number;
  source: string;
  kind: ArchiveKind;
  tag: string;
};

export type TapePoint = {
  date: string;
  sh: number | null;
  hs300: number | null;
  cyb: number | null;
  small: number | null;
  kc: number | null;
  alla: number | null;
  vol: number | null;
  shClose: number | null;
  hs300Close: number | null;
  cybClose: number | null;
  a50: number | null;
  zz500: number | null;
  gz: number | null;
  brokers: number | null;
  hstech: number | null;
  hstechClose: number | null;
  bond: number | null;
  bondClose: number | null;
  fx: number | null;
  fxClose: number | null;
};

export type BoardLead = {
  name: string;
  pct: number;
  share: number;
};

export type Desk = {
  asOf: number;
  hs300: Quote;
  sh: Quote;
  cyb: Quote;
  hstech: Quote;
  fx: Quote;
  bond: Quote;
  indicators: Indicators;
  breadth: Breadth;
  leaders: ComponentRow[];
  laggards: ComponentRow[];
  series: Bar[];
  shSeries: Bar[];
  tape: TapePoint[];
  emotion: Emotion | null;
  ladder: LadderQuote[];
  brokers: LadderQuote | null;
  margin: MarginDay[];
  author: AuthorNote | null;
  feed: ArchiveItem[];
  notes: DayRef[];
  boardLead: BoardLead | null;
  warnings: string[];
};

export type BreadthPayload = {
  asOf: number;
  rows: ComponentRow[];
  breadth: Breadth;
  warning: string | null;
};

export type ArchiveSource = "all" | "review" | "intel" | "report";

export type ArchivePayload = {
  items: ArchiveItem[];
  matched: number;
  hasMore: boolean;
  counts: { all: number; review: number; intel: number; report: number };
  warning: string | null;
};
