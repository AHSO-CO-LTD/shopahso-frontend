"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import AdminStatisticsAlerts from "@/components/admin/statistics/AdminStatisticsAlerts";
import AdminStatisticsBreakdown from "@/components/admin/statistics/AdminStatisticsBreakdown";
import AdminStatisticsChart from "@/components/admin/statistics/AdminStatisticsChart";
import AdminStatisticsDonutChart from "@/components/admin/statistics/AdminStatisticsDonutChart";
import AdminStatisticsFilters from "@/components/admin/statistics/AdminStatisticsFilters";
import AdminStatisticsKpiGrid from "@/components/admin/statistics/AdminStatisticsKpiGrid";
import AdminStatisticsRates from "@/components/admin/statistics/AdminStatisticsRates";
import AdminStatisticsSkeleton from "@/components/admin/statistics/AdminStatisticsSkeleton";
import AdminStatisticsTopVariants from "@/components/admin/statistics/AdminStatisticsTopVariants";
import {
  formatCompactNumber,
  formatDateTime,
  formatMoney,
  getStatisticsToastMessage,
} from "@/components/admin/statistics/statistics-format";
import type { AdminDashboardStatistics, StatisticsQuery } from "@/lib/admin-statistics/types";
import { getAdminDashboardStatistics } from "@/lib/api/services/admin-statistics.service";

const defaultQuery: StatisticsQuery = {
  interval: "day",
  preset: "30d",
  topLimit: 10,
};

type SignalTone = "info" | "success" | "warning" | "neutral";

const signalToneClasses: Record<SignalTone, { panel: string; value: string }> = {
  info: {
    panel: "border-primary/35 bg-primary/5",
    value: "text-primary",
  },
  neutral: {
    panel: "border-border bg-muted/15",
    value: "text-foreground",
  },
  success: {
    panel: "border-[oklch(0.58_0.18_145_/_0.45)] bg-[oklch(0.58_0.18_145_/_0.06)]",
    value: "text-[oklch(0.36_0.14_145)]",
  },
  warning: {
    panel: "border-secondary/70 bg-secondary/10",
    value: "text-[oklch(0.46_0.12_80)]",
  },
};

function QuickSignal({
  label,
  tone,
  value,
}: {
  label: string;
  tone: SignalTone;
  value: string;
}) {
  const toneClass = signalToneClasses[tone];

  return (
    <article className={["border px-4 py-4", toneClass.panel].join(" ")}>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={["mt-3 break-words font-mono text-2xl font-black", toneClass.value].join(" ")}>
        {value}
      </p>
    </article>
  );
}

export default function AdminStatisticsDashboard() {
  const [query, setQuery] = useState<StatisticsQuery>(defaultQuery);
  const [data, setData] = useState<AdminDashboardStatistics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStatistics = useCallback(async (nextQuery: StatisticsQuery) => {
    const toastId = toast.loading("Đang tải thống kê...");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextData = await getAdminDashboardStatistics(nextQuery);
      setData(nextData);
      toast.success("Đã tải thống kê", { id: toastId });

      if (nextData.modules.website.meta.trackingAvailable === false) {
        toast.warning("Chưa có dữ liệu lượt truy cập website");
      }
    } catch (error) {
      const message = getStatisticsToastMessage(error);
      setErrorMessage(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStatistics(defaultQuery);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadStatistics]);

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Thống kê quản trị
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Tổng quan vận hành</h2>
          </div>
          {data ? (
            <p className="text-sm text-muted-foreground">
              {formatDateTime(data.meta.from)} đến {formatDateTime(data.meta.to)}
            </p>
          ) : null}
        </div>

        <AdminStatisticsFilters
          isLoading={isLoading}
          onApply={(nextQuery) => {
            setQuery(nextQuery);
            void loadStatistics(nextQuery);
          }}
          onChange={setQuery}
          query={query}
        />

        {errorMessage ? (
          <section className="flex items-start gap-3 border border-destructive bg-destructive/5 px-5 py-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <h3 className="font-black text-destructive">{errorMessage}</h3>
              <p className="mt-1 text-muted-foreground">
                Vui lòng kiểm tra quyền ADMIN, phiên đăng nhập hoặc bộ lọc thời gian.
              </p>
            </div>
          </section>
        ) : null}

        {isLoading && !data ? <AdminStatisticsSkeleton /> : null}

        {data ? (
          <div className="space-y-6">
            <AdminStatisticsKpiGrid cards={data.cards} comparison={data.comparison} />

            <AdminStatisticsRates rates={data.rates} />

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
              <section className="border border-border bg-background">
                <div className="border-b border-border px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Tín hiệu nhanh
                  </p>
                  <h3 className="mt-1 text-base font-black tracking-tight">Trạng thái cần theo dõi</h3>
                </div>
                <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-4">
                  <QuickSignal
                    label="Doanh thu đã thanh toán"
                    tone="success"
                    value={formatMoney(data.summary.revenue)}
                  />
                  <QuickSignal
                    label="Đơn đã thanh toán"
                    tone="success"
                    value={formatCompactNumber(data.summary.paidOrders)}
                  />
                  <QuickSignal
                    label="Yêu cầu chờ xử lý"
                    tone="warning"
                    value={formatCompactNumber(data.summary.pendingQuoteRequests)}
                  />
                  <QuickSignal
                    label="Lượt truy cập"
                    tone={data.summary.visits === null ? "neutral" : "info"}
                    value={formatCompactNumber(data.summary.visits)}
                  />
                </div>
              </section>

              <AdminStatisticsAlerts alerts={data.alerts} />
            </section>

            {data.modules.website.meta.trackingAvailable === false ? (
              <section className="flex items-start gap-3 border border-border bg-secondary/15 px-5 py-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-secondary-foreground" />
                <div>
                  <h3 className="font-black">Chưa có dữ liệu lượt truy cập website</h3>
                  <p className="mt-1 text-muted-foreground">
                    {data.modules.website.meta.trackingMessage ??
                      "API hiện chưa có dữ liệu visit/session từ hệ thống tracking."}
                  </p>
                </div>
              </section>
            ) : null}

            <section className="grid gap-6 xl:grid-cols-2">
              <AdminStatisticsChart series={data.series.users} />
              <AdminStatisticsChart series={data.series.orders} tone="success" />
              <AdminStatisticsChart series={data.series.revenue} valueType="money" />
              <AdminStatisticsChart series={data.series.quoteRequests} tone="warning" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <AdminStatisticsDonutChart
                items={data.breakdowns.orderStatus}
                title="Trạng thái đơn hàng"
              />
              <AdminStatisticsDonutChart
                items={data.breakdowns.paymentStatus}
                title="Trạng thái thanh toán"
              />
              <AdminStatisticsDonutChart
                items={data.breakdowns.quoteRequestStatus}
                title="Trạng thái báo giá"
              />
              <AdminStatisticsDonutChart
                items={data.breakdowns.stock}
                title="Tình trạng tồn kho"
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="grid gap-6">
                <AdminStatisticsTopVariants
                  items={data.topItems.viewedProducts}
                  title="Được xem nhiều"
                />
                <AdminStatisticsTopVariants
                  items={data.topItems.purchasedProducts}
                  title="Được mua nhiều"
                />
              </div>
              <div className="grid content-start gap-6">
                <AdminStatisticsBreakdown
                  items={data.breakdowns.userRoles}
                  title="Vai trò người dùng"
                />
                <AdminStatisticsBreakdown
                  items={data.breakdowns.paymentStatus}
                  title="Trạng thái thanh toán"
                />
                <AdminStatisticsBreakdown
                  items={data.breakdowns.stock}
                  title="Tình trạng tồn kho"
                />
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
