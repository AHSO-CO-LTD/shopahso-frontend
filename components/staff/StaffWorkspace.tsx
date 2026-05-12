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

export default function StaffWorkspace() {
  const revealRef = useDashboardReveal();

  return (
    <StaffLayout>
      <div ref={revealRef} className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div data-dashboard-block>
          <DashboardSignalStrip signals={staffSignals} />
        </div>

        <div className="mt-8 space-y-8">
          <div data-dashboard-block>
            <DashboardMetricGrid metrics={staffOverviewCards} />
          </div>

          <section className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <div data-dashboard-block>
              <DashboardWorkstreamList
                items={staffModules}
                overline="Nghiệp vụ chính"
                title="Khu xử lý cho nhân viên"
              />
            </div>
            <div data-dashboard-block>
              <DashboardQueueList
                items={staffQueues}
                overline="Hàng đợi"
                title="Cần ưu tiên"
              />
            </div>
          </section>

          <div data-dashboard-block>
            <DashboardActionPanelGrid panels={staffPanels} />
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
