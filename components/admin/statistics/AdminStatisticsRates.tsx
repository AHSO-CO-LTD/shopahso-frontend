import type { DashboardRates } from "@/lib/admin-statistics/types";
import { formatPercent, getRateLabel } from "@/components/admin/statistics/statistics-format";

type AdminStatisticsRatesProps = {
  rates: DashboardRates;
};

type RateTone = "success" | "warning" | "danger";

const rateOrder: Array<keyof DashboardRates> = [
  "paidOrderRate",
  "cancellationRate",
  "quoteCompletionRate",
  "outOfStockRate",
  "contactForPriceRate",
];

const rateToneByKey: Record<keyof DashboardRates, RateTone> = {
  cancellationRate: "danger",
  contactForPriceRate: "warning",
  outOfStockRate: "danger",
  paidOrderRate: "success",
  quoteCompletionRate: "success",
};

const rateToneClasses: Record<RateTone, { panel: string; text: string; bar: string }> = {
  danger: {
    bar: "bg-destructive",
    panel: "border-destructive/40 bg-destructive/5",
    text: "text-destructive",
  },
  success: {
    bar: "bg-[oklch(0.58_0.18_145)]",
    panel: "border-[oklch(0.58_0.18_145_/_0.45)] bg-[oklch(0.58_0.18_145_/_0.06)]",
    text: "text-[oklch(0.36_0.14_145)]",
  },
  warning: {
    bar: "bg-secondary",
    panel: "border-secondary/70 bg-secondary/10",
    text: "text-[oklch(0.46_0.12_80)]",
  },
};

export default function AdminStatisticsRates({ rates }: AdminStatisticsRatesProps) {
  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Tỷ lệ vận hành
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight">Hiệu suất hiện tại</h3>
      </div>
      <div className="grid gap-0 md:grid-cols-5">
        {rateOrder.map((key) => {
          const tone = rateToneByKey[key];
          const value = Math.max(0, Math.min(100, rates[key]));

          return (
            <article
              key={key}
              className={["border px-4 py-4", rateToneClasses[tone].panel].join(" ")}
            >
              <p className="text-xs font-semibold text-muted-foreground">{getRateLabel(key)}</p>
              <p className={["mt-3 font-mono text-2xl font-black", rateToneClasses[tone].text].join(" ")}>
                {formatPercent(rates[key])}
              </p>
              <div className="mt-3 h-2 border border-border bg-background">
                <div className={["h-full", rateToneClasses[tone].bar].join(" ")} style={{ width: `${value}%` }} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
