"use client";

import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { ChartSeries } from "@/lib/admin-statistics/types";
import {
  formatCompactNumber,
  formatDateBucket,
  formatFullDateBucket,
  formatMoney,
  normalizeStatisticsLabel,
} from "@/components/admin/statistics/statistics-format";

type AdminStatisticsChartProps = {
  series: ChartSeries;
  tone?: "primary" | "success" | "warning";
  valueType?: "money" | "number";
};

type ChartDatum = {
  bucket: string;
  fullDate: string;
  value: number;
};

const lineColors = {
  primary: "oklch(0.42 0.16 250)",
  success: "oklch(0.58 0.18 145)",
  warning: "oklch(0.62 0.14 80)",
};

function formatValue(value: number, valueType: AdminStatisticsChartProps["valueType"]) {
  return valueType === "money" ? formatMoney(value) : formatCompactNumber(value);
}

function formatAxisValue(value: number, valueType: AdminStatisticsChartProps["valueType"]) {
  if (valueType !== "money") {
    return formatCompactNumber(value);
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 1,
    }).format(value / 1_000_000)} tr`;
  }

  if (Math.abs(value) >= 1_000) {
    return `${new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(value / 1_000)}k`;
  }

  return `${new Intl.NumberFormat("vi-VN").format(value)} đ`;
}

function getTrendLabel(points: ChartSeries["points"]) {
  if (points.length < 2) {
    return "Chưa đủ dữ liệu xu hướng";
  }

  const first = points[0]?.y ?? 0;
  const last = points[points.length - 1]?.y ?? 0;
  const delta = last - first;

  if (delta > 0) {
    return `Tăng ${formatCompactNumber(delta)} so với điểm đầu`;
  }

  if (delta < 0) {
    return `Giảm ${formatCompactNumber(Math.abs(delta))} so với điểm đầu`;
  }

  return "Không đổi so với điểm đầu";
}

function buildChartData(points: ChartSeries["points"]) {
  return points.map((point) => ({
    bucket: formatDateBucket(point.x),
    fullDate: formatFullDateBucket(point.x),
    value: point.y,
  }));
}

function StatisticsTooltip({
  active,
  payload,
  valueType,
}: TooltipContentProps<TooltipValueType, number | string> & {
  valueType: AdminStatisticsChartProps["valueType"];
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0]?.payload as ChartDatum | undefined;

  if (!datum) {
    return null;
  }

  return (
    <div className="border border-border bg-background px-3 py-2 text-sm shadow-none">
      <p className="font-semibold text-foreground">{datum.fullDate}</p>
      <p className="mt-1 font-mono font-black text-primary">
        {formatValue(datum.value, valueType)}
      </p>
    </div>
  );
}

export default function AdminStatisticsChart({
  series,
  tone = "primary",
  valueType = "number",
}: AdminStatisticsChartProps) {
  const points = series.points ?? [];
  const total = points.reduce((sum, point) => sum + point.y, 0);
  const maxPoint = points.reduce<ChartSeries["points"][number] | null>(
    (currentMax, point) => (!currentMax || point.y > currentMax.y ? point : currentMax),
    null,
  );
  const latestPoint = points[points.length - 1] ?? null;
  const displayLabel = normalizeStatisticsLabel(series.label);
  const chartData = buildChartData(points);
  const shouldShowPointLabels = valueType !== "money" && chartData.length <= 6;
  const yAxisWidth = valueType === "money" ? 58 : 40;
  const lineColor = lineColors[tone];

  return (
    <section className="border border-border bg-background">
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Biểu đồ thống kê
          </p>
          <h3 className="mt-1 text-base font-black tracking-tight">{displayLabel}</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {points.length} mốc thời gian · {getTrendLabel(points)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tổng
          </p>
          <p className="mt-1 font-mono text-sm font-semibold">{formatValue(total, valueType)}</p>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="px-5 py-5">
          <div className="grid grid-cols-3 border border-border bg-muted/20">
            <div className="border-r border-border px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Cao nhất
              </p>
              <p className="mt-1 font-mono text-sm font-black">
                {formatValue(maxPoint?.y ?? 0, valueType)}
              </p>
            </div>
            <div className="border-r border-border px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Mới nhất
              </p>
              <p className="mt-1 font-mono text-sm font-black">
                {formatValue(latestPoint?.y ?? 0, valueType)}
              </p>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Mốc gần nhất
              </p>
              <p className="mt-1 truncate text-xs font-semibold">
                {formatFullDateBucket(latestPoint?.x)}
              </p>
            </div>
          </div>

          <ChartContainer
            className="mt-6 h-[280px]"
            config={{
              value: {
                color: lineColor,
                label: displayLabel,
              },
            }}
          >
            <LineChart
              data={chartData}
              margin={{
                bottom: 14,
                left: 8,
                right: 28,
                top: shouldShowPointLabels ? 30 : 18,
              }}
            >
              <CartesianGrid strokeDasharray="5 7" vertical={false} />
              <XAxis
                axisLine={{ stroke: "oklch(0.88 0.01 250)" }}
                dataKey="bucket"
                interval={0}
                minTickGap={12}
                tick={{
                  fill: "oklch(0.45 0.02 250)",
                  fontFamily: "var(--font-roboto-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{
                  fill: "oklch(0.45 0.02 250)",
                  fontFamily: "var(--font-roboto-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
                tickFormatter={(value) => formatAxisValue(Number(value), valueType)}
                tickLine={false}
                width={yAxisWidth}
              />
              <ChartTooltip
                content={(props) => (
                  <StatisticsTooltip {...props} valueType={valueType} />
                )}
                cursor={{
                  stroke: "oklch(0.42 0.16 250)",
                  strokeDasharray: "4 6",
                  strokeWidth: 1,
                }}
              />
              <Line
                activeDot={{
                  fill: "oklch(1 0 0)",
                  r: 5,
                  stroke: lineColor,
                  strokeWidth: 3,
                }}
                dataKey="value"
                dot={{
                  fill: "oklch(1 0 0)",
                  r: 4,
                  stroke: lineColor,
                  strokeWidth: 3,
                }}
                isAnimationActive={false}
                name={displayLabel}
                stroke="var(--color-value)"
                strokeLinecap="square"
                strokeLinejoin="miter"
                strokeWidth={3}
                type="linear"
              >
                {shouldShowPointLabels ? (
                  <LabelList
                    className="fill-foreground font-mono text-[11px] font-black"
                    dataKey="value"
                    formatter={(value) => formatValue(Number(value ?? 0), valueType)}
                    position="top"
                  />
                ) : null}
              </Line>
            </LineChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="px-5 py-12 text-sm text-muted-foreground">
          Chưa có điểm dữ liệu cho biểu đồ này.
        </div>
      )}
    </section>
  );
}
