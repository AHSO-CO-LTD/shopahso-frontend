"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { BreakdownItem } from "@/lib/admin-statistics/types";
import {
  formatCompactNumber,
  getStatisticsBreakdownLabel,
} from "@/components/admin/statistics/statistics-format";

type AdminStatisticsDonutChartProps = {
  items: BreakdownItem[];
  title: string;
};

const fallbackColors = [
  "oklch(0.42 0.16 250)",
  "oklch(0.58 0.18 145)",
  "oklch(0.62 0.14 80)",
  "oklch(0.55 0.22 25)",
  "oklch(0.45 0.02 250)",
];

const semanticColors: Record<string, string> = {
  ACTIVE: "oklch(0.58 0.18 145)",
  ADMIN: "oklch(0.42 0.16 250)",
  CANCELLED: "oklch(0.55 0.22 25)",
  CLOSED: "oklch(0.58 0.18 145)",
  CONFIRMED: "oklch(0.42 0.16 250)",
  DRAFT: "oklch(0.62 0.14 80)",
  IN_STOCK: "oklch(0.58 0.18 145)",
  OUT_OF_STOCK: "oklch(0.55 0.22 25)",
  PAID: "oklch(0.58 0.18 145)",
  PENDING: "oklch(0.62 0.14 80)",
  QUOTED: "oklch(0.42 0.16 250)",
  REJECTED: "oklch(0.55 0.22 25)",
  STAFF: "oklch(0.62 0.14 80)",
  UNPAID: "oklch(0.62 0.14 80)",
  USER: "oklch(0.58 0.18 145)",
};

function getItemColor(item: BreakdownItem, index: number) {
  return semanticColors[item.key] ?? fallbackColors[index % fallbackColors.length];
}

export default function AdminStatisticsDonutChart({
  items,
  title,
}: AdminStatisticsDonutChartProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const chartData = items.map((item, index) => ({
    ...item,
    fill: getItemColor(item, index),
    label: getStatisticsBreakdownLabel(item.key, item.label),
  }));

  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Donut
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight">{title}</h3>
      </div>

      {chartData.length > 0 ? (
        <div className="grid gap-4 px-5 py-5 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
          <ChartContainer className="h-[180px]" config={{ value: { label: title } }}>
            <PieChart>
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) {
                    return null;
                  }

                  const payloadItem = payload[0]?.payload as (typeof chartData)[number] | undefined;

                  if (!payloadItem) {
                    return null;
                  }

                  return (
                    <div className="border border-border bg-background px-3 py-2 text-sm shadow-none">
                      <p className="font-semibold">{payloadItem.label}</p>
                      <p className="mt-1 font-mono font-black">
                        {formatCompactNumber(payloadItem.value)}
                      </p>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={48}
                isAnimationActive={false}
                nameKey="label"
                outerRadius={76}
                stroke="oklch(1 0 0)"
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell fill={entry.fill} key={entry.key} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="divide-y divide-border border border-border">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-sm font-semibold text-muted-foreground">Tổng</span>
              <span className="font-mono text-sm font-black">{formatCompactNumber(total)}</span>
            </div>
            {chartData.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                  <span className="size-2 shrink-0" style={{ backgroundColor: item.fill }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="font-mono text-sm font-black">
                  {formatCompactNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-muted-foreground">
          Chưa có dữ liệu phân bổ.
        </div>
      )}
    </section>
  );
}
