import { createFileRoute } from "@tanstack/react-router";
import { INDICATORS, ZONE_ORDER, toneClass, toneLabel } from "@/lib/zones";

export const Route = createFileRoute("/method")({
  head: () => ({ meta: [{ title: "口径 · 鳄鱼派看盘" }] }),
  component: MethodPage,
});

const SUMS = [
  ["tup", "上涨家数", "沪深300成分里涨跌幅大于 0 的只数。"],
  ["tdn", "下跌家数", "涨跌幅小于 0 的只数。平盘单独计，不进上涨也不进下跌。"],
  ["t5u", "涨超 5%", "涨跌幅大于等于 5% 的只数。"],
  ["t5d", "跌超 5%", "涨跌幅小于 -5% 的只数。"],
];

const NOTES: Array<[string, string]> = [
  ["2026.10.16 按照流程上涨", "https://gator.ronchy2000.top/articles/2026-10-16-wx-dc354e7c-2247492068-1/"],
  ["2026.10.13 市场底的空间与时间", "https://gator.ronchy2000.top/articles/2026-10-13-wx-dc354e7c-2247492030-1/"],
  ["2026.10.12 流程走完就反弹", "https://gator.ronchy2000.top/articles/2026-10-12-wx-dc354e7c-2247492020-1/"],
  ["2026.10.9 护盘底、市场底", "https://gator.ronchy2000.top/articles/2026-10-09-wx-dc354e7c-2247492007-1/"],
  ["2026.9.28 按止跌流程走", "https://gator.ronchy2000.top/articles/2026-09-28-wx-dc354e7c-2247491960-1/"],
  ["2026.6.11 护盘的三种力度", "https://gator.ronchy2000.top/articles/2026-06-11-1hkqf6q1-46ws367_hlo3a/"],
  ["2025.11.12 龙哥护盘三板斧", "https://gator.ronchy2000.top/articles/2025-11-12-5db6nptlol8di2kbpjvmvq/"],
  ["2025.4.8 护盘之后怎么走", "https://gator.ronchy2000.top/articles/2025-04-08-ovntgajx9ocifldzc3suzg/"],
];

function MethodPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="font-serif text-xs tracking-widest text-faint">METHOD</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">口径</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          盘面先按公开日评里反复出现的读法，给今天一个结论；下面的数字是对照用的原料。结论不是作者当天写的复盘，对不上就不说。不是交易建议。
        </p>
      </div>

      <section className="space-y-3 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-paper">他怎么读一天</h2>
        <p>
          日评写了六百多篇，每天的句子不一样，读法是稳定的。先分两层底。护盘底是龙哥把跌停和指数按住，常常走出 V，容易被按回去。市场底是市场自己磨出来的，更像 U。他们拿 7 月 12 个交易日、3 月 11 个、去年 12 月 17 个来对照，时间不够就还写磨底。
        </p>
        <p>
          护盘有三板斧：买龙票（大金融、中字头），买指数 ETF，发利好。一起出，才算严重。也有三种力度。小维护只用金融和中字头，目的是减缓下跌。中护盘买上证50、沪深300、中证500 的 ETF，给权重流动性。大救市才是宽基一起上，再开会。他们更希望小维护和中护盘就把底买出来。这个位置如果非要大救市，他们会躲。
        </p>
        <p>
          止跌有顺序：上证50、大金融、中字头，然后沪深300 和中证500，最后才是中证1000、2000 和微盘。中途会错位。科技可以涨，不能抢风头。没钱硬拉科技，他们叫从 ICU 直接拉去 KTV，跌势不会停。
        </p>
        <p>
          右侧不看色带。他们点名的是基差、成交有没有增量、赚钱效应、进攻还是防御、证券这个气氛组、还有剪刀差。盘面上的雷达就是这些里能打分的七件：赚钱效应、护盘线、结构、气氛组、杠杆、量能、周线。中心是 0，外圈是 100，满格才算这一项齐了。磨底的日子本来就不满。基差不进雷达，贴水很深时，旧的色带已经没有分辨力。沪深300 和中证2000 的绝对差，0.5 个点以上叫有分歧，1 以上较重，2 以上严重。上证对创业板、上证对恒生科技，也是同一套：差大了，单边就不容易持续。证券平时可以不动，止跌和转折时要涨多跌少。
        </p>
        <p>
          仓位上，长线不空仓也不重仓。基本面决定做不做，技术面决定怎么做。看周线，跌到前一个平台再加一点。短线才快进快出。试多不是重仓。看对只是一半，被淘汰通常是仓位重了、成本高了、或者耗太久。
        </p>
        <ul className="space-y-2">
          {NOTES.map(([title, href]) => (
            <li key={href}>
              <a className="text-paper underline" href={href} target="_blank" rel="noreferrer">
                {title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">五个颜色指标</h2>
        <p className="text-sm text-muted">区间和颜色沿用原浮动窗，不随市况改阈值。颜色只表示落在哪一档。</p>
        <ul className="space-y-3">
          {ZONE_ORDER.map((key) => {
            const spec = INDICATORS[key];
            return (
              <li key={key} className="rounded-3xl border border-line bg-panel p-4">
                <p className="text-sm text-paper">
                  <span className="num text-faint">{spec.abbr}</span> {spec.name}
                </p>
                <p className="mt-1 text-sm text-muted">{spec.hint}</p>
                <p className="mt-2 text-xs text-faint">
                  <span className={toneClass(spec.colors[0])}>{toneLabel(spec.colors[0])}</span>
                  {" < "}
                  {spec.lo}
                  {" · "}
                  <span className={toneClass(spec.colors[1])}>{toneLabel(spec.colors[1])}</span>
                  {" · "}
                  <span className={toneClass(spec.colors[2])}>{toneLabel(spec.colors[2])}</span>
                  {" ≥ "}
                  {spec.hi}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-medium">涨跌结构</h2>
        <ul className="space-y-2">
          {SUMS.map(([abbr, name, text]) => (
            <li key={abbr} className="text-sm text-muted">
              <span className="num text-paper">{abbr}</span> {name}。{text}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-paper">数据从哪来</h2>
        <p>
          指数、十年国债 ETF、恒生科技和离岸人民币来自新浪财经公开行情。基差里的期货价来自金投网「沪深加权」，算法与{" "}
          <a className="text-paper underline" href="https://github.com/user-tq/EYU-feature" target="_blank" rel="noreferrer">
            user-tq/EYU-feature
          </a>{" "}
          的 <span className="num">get_hs300_baise</span> 相同：沪深300最新价减去该期货价。
        </p>
        <p>
          原项目的全 A 成交额走东财指数 <span className="num">47.800000</span>。那条主机在部分网络会拒绝访问，所以这里改成上证指数成交额加深证
          A 指成交额，单位仍是万亿，并标成「沪深成交」。阈值 1 和 2 没改。
        </p>
        <p>
          沪深300成分和涨跌家数来自东方财富成分接口，分档方式和原项目 <span className="num">sum_hs300</span> 一致。
        </p>
        <p>
          档案来自{" "}
          <a className="text-paper underline" href="https://github.com/Ronchy2000/Gator-Investment-Research" target="_blank" rel="noreferrer">
            Ronchy2000/Gator-Investment-Research
          </a>{" "}
          的公开站点{" "}
          <a className="text-paper underline" href="https://gator.ronchy2000.top/" target="_blank" rel="noreferrer">
            gator.ronchy2000.top
          </a>
          。每日内容读 RSS，历史研报读公开目录。点开后到原文页。
        </p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed text-muted">
        <h2 className="text-base font-medium text-paper">怎么看时间</h2>
        <p>
          页眉时钟是北京时间，用来看现在是不是交易时段。行情旁边的日期时间是上游报价时间。如果它停在上一个交易日，那是收盘数据，不是页面卡住。原项目也提醒过这一点。
        </p>
        <p>摸鱼条把缩写收成一条窄栏，方便小屏扫一眼。右上角可以切回完整盘面。</p>
      </section>
    </div>
  );
}
