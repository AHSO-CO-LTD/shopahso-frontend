"use client";

import DashboardActionPanelGrid from "@/components/dashboard/DashboardActionPanelGrid";
import DashboardMetricGrid from "@/components/dashboard/DashboardMetricGrid";
import DashboardQueueList from "@/components/dashboard/DashboardQueueList";
import DashboardSignalStrip from "@/components/dashboard/DashboardSignalStrip";
import DashboardWorkstreamList from "@/components/dashboard/DashboardWorkstreamList";
import useDashboardReveal from "@/components/dashboard/useDashboardReveal";
import StaffLayout from "@/components/staff/StaffLayout";
import {
  staffModules,
  staffOverviewCards,
  staffPanels,
  staffQueues,
  staffSignals,
} from "@/components/staff/staff-data";

function EmptyBlock({ title }: { title: string }) {
  return (
    <div className="border border-border bg-background px-6 py-10 text-sm text-muted-foreground">
      {title}
    </div>
  );
}

export default function StaffWorkspace() {
  const revealRef = useDashboardReveal();

  return (
    <StaffLayout>
      <div ref={revealRef} className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div data-dashboard-block>
          {staffSignals.length > 0 ? (
            <DashboardSignalStrip signals={staffSignals} />
          ) : (
            <EmptyBlock title="Khung tin hieu staff (cho du lieu tu API)." />
          )}
        </div>

        <div className="mt-8 space-y-8">
          <div data-dashboard-block>
            {staffOverviewCards.length > 0 ? (
              <DashboardMetricGrid metrics={staffOverviewCards} />
            ) : (
              <EmptyBlock title="Khung metric staff (khong con du lieu hardcode)." />
            )}
          </div>

          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <div data-dashboard-block>
              {staffModules.length > 0 ? (
                <DashboardWorkstreamList
                  items={staffModules}
                  overline="Nghiep vu chinh"
                  title="Khu xu ly cho nhan vien"
                />
              ) : (
                <EmptyBlock title="Khung workstream staff (cho du lieu tu API)." />
              )}
            </div>
            <div data-dashboard-block>
              {staffQueues.length > 0 ? (
                <DashboardQueueList items={staffQueues} overline="Hang doi" title="Can uu tien" />
              ) : (
                <EmptyBlock title="Khung queue staff (cho du lieu tu API)." />
              )}
            </div>
          </section>

          <div data-dashboard-block>
            {staffPanels.length > 0 ? (
              <DashboardActionPanelGrid panels={staffPanels} />
            ) : (
              <EmptyBlock title="Khung action panel staff (cho du lieu tu API)." />
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
