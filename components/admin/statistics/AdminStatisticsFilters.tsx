"use client";

import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  StatisticsInterval,
  StatisticsPreset,
  StatisticsQuery,
} from "@/lib/admin-statistics/types";
import {
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/components/admin/statistics/statistics-format";

type AdminStatisticsFiltersProps = {
  isLoading: boolean;
  query: StatisticsQuery;
  onApply: (query: StatisticsQuery) => void;
  onChange: (query: StatisticsQuery) => void;
};

const presetOptions: Array<{ label: string; value: StatisticsPreset }> = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày", value: "7d" },
  { label: "30 ngày", value: "30d" },
  { label: "Tháng", value: "month" },
  { label: "Năm", value: "year" },
];

export default function AdminStatisticsFilters({
  isLoading,
  query,
  onApply,
  onChange,
}: AdminStatisticsFiltersProps) {
  const updateQuery = (nextQuery: StatisticsQuery) => {
    onChange(nextQuery);
  };

  return (
    <section className="border border-border bg-muted/20 px-4 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {presetOptions.map((preset) => (
            <Button
              key={preset.value}
              aria-pressed={query.preset === preset.value}
              className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold"
              onClick={() =>
                updateQuery({
                  ...query,
                  from: undefined,
                  preset: preset.value,
                  to: undefined,
                })
              }
              type="button"
              variant={query.preset === preset.value ? "default" : "outline"}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-4 xl:min-w-[720px]">
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Từ ngày
            <input
              className="h-10 border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({
                  ...query,
                  from: fromDateTimeLocalValue(event.target.value),
                  preset: undefined,
                })
              }
              type="datetime-local"
              value={toDateTimeLocalValue(query.from)}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Đến ngày
            <input
              className="h-10 border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({
                  ...query,
                  preset: undefined,
                  to: fromDateTimeLocalValue(event.target.value),
                })
              }
              type="datetime-local"
              value={toDateTimeLocalValue(query.to)}
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Khoảng
            <select
              className="h-10 cursor-pointer border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({
                  ...query,
                  interval: event.target.value as StatisticsInterval,
                })
              }
              value={query.interval ?? "day"}
            >
              <option value="day">Ngày</option>
              <option value="week">Tuần</option>
              <option value="month">Tháng</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
            Top
            <select
              className="h-10 cursor-pointer border border-border bg-background px-3 text-sm font-semibold text-foreground outline-none focus:border-primary"
              onChange={(event) =>
                updateQuery({
                  ...query,
                  topLimit: Number(event.target.value),
                })
              }
              value={query.topLimit ?? 10}
            >
              {[5, 10, 20, 50].map((limit) => (
                <option key={limit} value={limit}>
                  {limit}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => onApply(query)}
          type="button"
        >
          <RefreshCcw className={isLoading ? "size-4 animate-spin" : "size-4"} />
          Áp dụng bộ lọc
        </Button>
      </div>
    </section>
  );
}
