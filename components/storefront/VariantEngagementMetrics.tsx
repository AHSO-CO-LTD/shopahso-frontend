"use client";

import { Eye, ShoppingCart, Star } from "lucide-react";
import type { ReactNode } from "react";
import type { CatalogVariantEngagement } from "@/lib/catalog/types";
import { getVariantEngagementMetrics } from "@/lib/catalog/variant-metrics";

type VariantEngagementMetricsProps = {
  className?: string;
  compact?: boolean;
  variant: CatalogVariantEngagement;
};

export default function VariantEngagementMetrics({
  className = "",
  compact = false,
  variant,
}: VariantEngagementMetricsProps) {
  const metrics = getVariantEngagementMetrics(variant);
  const iconClassName = compact ? "size-3.5" : "size-4";

  return (
    <dl
      aria-label="Chỉ số sản phẩm"
      className={[
        "flex flex-wrap items-center text-muted-foreground",
        compact ? "gap-x-2.5 gap-y-1 text-[11px]" : "gap-x-4 gap-y-1.5 text-sm",
        className,
      ].join(" ")}
    >
      <MetricCell
        icon={<Star aria-hidden="true" className={`${iconClassName} fill-yellow-400 text-yellow-500`} />}
        label={`${metrics.ratingAverage.toFixed(1)} sao, ${metrics.ratingCount} đánh giá thật`}
        value={metrics.ratingAverage.toFixed(1)}
      />
      <MetricCell
        icon={<Eye aria-hidden="true" className={iconClassName} />}
        label={`${metrics.viewCount.toLocaleString("vi-VN")} lượt xem`}
        value={metrics.viewCount.toLocaleString("vi-VN")}
      />
      <MetricCell
        icon={<ShoppingCart aria-hidden="true" className={iconClassName} />}
        label={`${metrics.orderCount.toLocaleString("vi-VN")} lượt mua`}
        value={metrics.orderCount.toLocaleString("vi-VN")}
      />
    </dl>
  );
}

function MetricCell({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-foreground">
        {icon}
        <span className="truncate tabular-nums">{value}</span>
      </dd>
    </div>
  );
}
