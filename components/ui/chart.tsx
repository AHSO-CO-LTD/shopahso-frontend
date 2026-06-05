"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = {
  [key: string]: {
    color?: string;
    label?: React.ReactNode;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

function buildChartStyle(config: ChartConfig) {
  return Object.entries(config).reduce<React.CSSProperties>((styles, [key, item]) => {
    if (!item.color) {
      return styles;
    }

    return {
      ...styles,
      [`--color-${key}`]: item.color,
    } as React.CSSProperties;
  }, {});
}

export function ChartContainer({
  children,
  className,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
}) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        className={cn(
          "flex aspect-auto justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-tooltip-cursor]:stroke-border",
          className,
        )}
        style={{
          ...buildChartStyle(config),
          ...props.style,
        }}
        {...props}
      >
        <ResponsiveContainer height="100%" width="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({
  active,
  className,
  payload,
}: TooltipContentProps<TooltipValueType, number | string> & {
  className?: string;
}) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={cn("border border-border bg-background px-3 py-2 text-sm shadow-none", className)}>
      {payload.map((item) => {
        const key = String(item.dataKey ?? item.name ?? "");
        const label = config[key]?.label ?? item.name;

        return (
          <div key={key} className="flex min-w-[140px] items-center justify-between gap-4">
            <span className="font-semibold text-muted-foreground">{label}</span>
            <span className="font-mono font-black text-foreground">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
