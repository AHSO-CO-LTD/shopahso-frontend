"use client";

import { BarChart3 } from "lucide-react";
import {
  adminModules,
  adminOverviewCards,
  adminQueues,
  adminSignals,
} from "@/components/admin/admin-data";
import DashboardMetricGrid from "@/components/dashboard/DashboardMetricGrid";
import DashboardQueueList from "@/components/dashboard/DashboardQueueList";
import DashboardSignalStrip from "@/components/dashboard/DashboardSignalStrip";
import DashboardWorkstreamList from "@/components/dashboard/DashboardWorkstreamList";
import useDashboardReveal from "@/components/dashboard/useDashboardReveal";
import { Button } from "@/components/ui/button";

export default function AdminOverview() {
  const revealRef = useDashboardReveal();

  return (
    <div ref={revealRef} className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <div data-dashboard-block>
        <DashboardSignalStrip signals={adminSignals} />
      </div>

      <div className="mt-8 space-y-8">
        <div data-dashboard-block>
          <DashboardMetricGrid metrics={adminOverviewCards} />
        </div>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_320px]">
          <div data-dashboard-block>
            <DashboardWorkstreamList
              items={adminModules}
              overline="Mô-đun"
              suffix={
                <Button
                  className="h-9 gap-2 border-border bg-muted/20 px-3 text-sm font-semibold"
                  type="button"
                  variant="outline"
                >
                  <BarChart3 className="size-4 text-primary" />
                  Theo ca
                </Button>
              }
              title="Khu vực chính"
            />
          </div>

          <div data-dashboard-block>
            <DashboardQueueList
              items={adminQueues}
              overline="Hàng đợi"
              title="Cần xử lý"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
