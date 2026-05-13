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

function EmptyBlock({ title }: { title: string }) {
  return (
    <div className="border border-border bg-background px-6 py-10 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

export default function AdminOverview() {
  const revealRef = useDashboardReveal();

  return (
    <div ref={revealRef} className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <div data-dashboard-block>
        {adminSignals.length > 0 ? (
          <DashboardSignalStrip signals={adminSignals} />
        ) : (
          <EmptyBlock title="Khung tin hieu admin (cho du lieu tu API)." />
        )}
      </div>

      <div className="mt-8 space-y-8">
        <div data-dashboard-block>
          {adminOverviewCards.length > 0 ? (
            <DashboardMetricGrid metrics={adminOverviewCards} />
          ) : (
            <EmptyBlock title="Khung metric admin (khong con du lieu hardcode)." />
          )}
        </div>

        <section className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_320px]">
          <div data-dashboard-block>
            {adminModules.length > 0 ? (
              <DashboardWorkstreamList
                items={adminModules}
                overline="Mo-dun"
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
                title="Khu vuc chinh"
              />
            ) : (
              <EmptyBlock title="Khung workstream admin (cho du lieu tu API)." />
            )}
          </div>

          <div data-dashboard-block>
            {adminQueues.length > 0 ? (
              <DashboardQueueList items={adminQueues} overline="Hang doi" title="Can xu ly" />
            ) : (
              <EmptyBlock title="Khung queue admin (cho du lieu tu API)." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
