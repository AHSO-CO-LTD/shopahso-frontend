import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { AlertItem } from "@/lib/admin-statistics/types";
import {
  formatCompactNumber,
  getAlertSeverityLabel,
  normalizeStatisticsLabel,
} from "@/components/admin/statistics/statistics-format";
import { getAdminAlertDestinationHref } from "@/components/admin/alerts/admin-alert-destinations";

type AdminStatisticsAlertsProps = {
  alerts: AlertItem[];
};

const severityOrder: Record<AlertItem["severity"], number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

const severityClasses: Record<
  AlertItem["severity"],
  { icon: string; item: string; value: string }
> = {
  critical: {
    icon: "border-destructive bg-destructive/10 text-destructive",
    item: "bg-destructive/5 hover:bg-destructive/8",
    value: "text-destructive",
  },
  info: {
    icon: "border-primary/40 bg-primary/10 text-primary",
    item: "bg-primary/5 hover:bg-primary/8",
    value: "text-primary",
  },
  warning: {
    icon: "border-secondary bg-secondary/20 text-secondary-foreground",
    item: "bg-secondary/10 hover:bg-secondary/15",
    value: "text-[oklch(0.46_0.12_80)]",
  },
};

function AlertIcon({ severity }: { severity: AlertItem["severity"] }) {
  const className = "size-4";

  if (severity === "critical") {
    return <ShieldAlert className={className} />;
  }

  if (severity === "warning") {
    return <AlertTriangle className={className} />;
  }

  return <Info className={className} />;
}

export default function AdminStatisticsAlerts({ alerts }: AdminStatisticsAlertsProps) {
  const sortedAlerts = [...alerts].sort(
    (first, second) => severityOrder[first.severity] - severityOrder[second.severity],
  );

  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Cần xử lý
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight">Cảnh báo vận hành</h3>
      </div>

      {sortedAlerts.length > 0 ? (
        <div className="divide-y divide-border">
          {sortedAlerts.map((alert) => {
            const severityClass = severityClasses[alert.severity];
            const href = getAdminAlertDestinationHref(alert);
            const content = (
              <div
                className={[
                  "flex items-center justify-between gap-4 px-5 py-4 transition-colors",
                  severityClass.item,
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "flex size-9 shrink-0 items-center justify-center border",
                      severityClass.icon,
                    ].join(" ")}
                  >
                    <AlertIcon severity={alert.severity} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {normalizeStatisticsLabel(alert.label)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {getAlertSeverityLabel(alert.severity)}
                    </p>
                  </div>
                </div>
                <p className={["font-mono text-xl font-black", severityClass.value].join(" ")}>
                  {formatCompactNumber(alert.value)}
                </p>
              </div>
            );

            return (
              <Link key={alert.key} className="block cursor-pointer" href={href}>
                {content}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-muted-foreground">
          Không có cảnh báo cần xử lý trong khoảng thời gian này.
        </div>
      )}
    </section>
  );
}
