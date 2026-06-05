import type {
  StatisticsCard,
  StatisticsComparison,
  StatisticsComparisonMetric,
} from "@/lib/admin-statistics/types";
import {
  formatCompactNumber,
  formatMoney,
  formatPercent,
  getStatisticsCardLabel,
} from "@/components/admin/statistics/statistics-format";

type AdminStatisticsKpiGridProps = {
  cards: StatisticsCard[];
  comparison?: StatisticsComparison;
};

type Tone = "info" | "success" | "warning" | "danger" | "neutral";

const comparisonByCardKey: Record<string, keyof StatisticsComparison["metrics"]> = {
  newUsers: "newUsers",
  orders: "orders",
  paidOrders: "paidOrders",
  quoteRequests: "quoteRequests",
  revenue: "revenue",
};

const toneClasses: Record<Tone, { panel: string; value: string; badge: string }> = {
  danger: {
    badge: "border-destructive bg-destructive/8 text-destructive",
    panel: "border-destructive/40 bg-destructive/5",
    value: "text-destructive",
  },
  info: {
    badge: "border-primary/40 bg-primary/8 text-primary",
    panel: "border-primary/35 bg-primary/5",
    value: "text-primary",
  },
  neutral: {
    badge: "border-border bg-muted/20 text-muted-foreground",
    panel: "border-border bg-background",
    value: "text-foreground",
  },
  success: {
    badge: "border-[oklch(0.58_0.18_145)] bg-[oklch(0.58_0.18_145_/_0.08)] text-[oklch(0.36_0.14_145)]",
    panel: "border-[oklch(0.58_0.18_145_/_0.45)] bg-[oklch(0.58_0.18_145_/_0.06)]",
    value: "text-[oklch(0.36_0.14_145)]",
  },
  warning: {
    badge: "border-secondary bg-secondary/20 text-secondary-foreground",
    panel: "border-secondary/70 bg-secondary/10",
    value: "text-[oklch(0.46_0.12_80)]",
  },
};

function getCardTone(key: string): Tone {
  if (key === "revenue" || key === "paidOrders") {
    return "success";
  }

  if (key === "pendingQuoteRequests" || key === "quoteRequests") {
    return "warning";
  }

  if (key === "orders" || key === "newUsers" || key === "registeredUsers") {
    return "info";
  }

  if (key === "products" || key === "variants" || key === "newProducts") {
    return "neutral";
  }

  return "neutral";
}

function formatCardValue(card: StatisticsCard) {
  if (card.key.toLowerCase().includes("revenue")) {
    return formatMoney(card.value);
  }

  return formatCompactNumber(card.value);
}

function getComparisonTone(metric: StatisticsComparisonMetric) {
  if (metric.changePercent > 0) {
    return toneClasses.success.badge;
  }

  if (metric.changePercent < 0) {
    return toneClasses.danger.badge;
  }

  return toneClasses.neutral.badge;
}

function ComparisonBadge({ metric }: { metric?: StatisticsComparisonMetric }) {
  if (!metric) {
    return null;
  }

  const prefix = metric.changePercent > 0 ? "+" : "";

  return (
    <span
      className={[
        "mt-4 inline-flex border px-2 py-1 font-mono text-[11px] font-bold",
        getComparisonTone(metric),
      ].join(" ")}
    >
      {prefix}
      {formatPercent(metric.changePercent)} so với kỳ trước
    </span>
  );
}

export default function AdminStatisticsKpiGrid({
  cards,
  comparison,
}: AdminStatisticsKpiGridProps) {
  if (cards.length === 0) {
    return (
      <section className="border border-border bg-background px-6 py-10 text-sm text-muted-foreground">
        Chưa có dữ liệu KPI trong khoảng thời gian này.
      </section>
    );
  }

  return (
    <section className="grid gap-0 border border-border bg-background md:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => {
        const tone = getCardTone(card.key);
        const comparisonKey = comparisonByCardKey[card.key];
        const comparisonMetric = comparisonKey ? comparison?.metrics[comparisonKey] : undefined;

        return (
          <article
            key={card.key}
            className={[
              "min-h-[148px] border px-5 py-5 transition-colors",
              toneClasses[tone].panel,
            ].join(" ")}
          >
            <p className="text-sm font-semibold text-muted-foreground">
              {getStatisticsCardLabel(card.key, card.label)}
            </p>
            <p
              className={[
                "mt-5 break-words text-3xl font-black tracking-tight",
                toneClasses[tone].value,
              ].join(" ")}
            >
              {formatCardValue(card)}
            </p>
            <ComparisonBadge metric={comparisonMetric} />
          </article>
        );
      })}
    </section>
  );
}
