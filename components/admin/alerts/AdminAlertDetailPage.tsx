import Link from "next/link";
import { AlertTriangle, ArrowLeft, ExternalLink, Info, ShieldAlert } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import type { AlertItem } from "@/lib/admin-statistics/types";
import type { AdminAlertDestination } from "@/components/admin/alerts/admin-alert-destinations";

type AdminAlertDetailPageProps = {
  destination: AdminAlertDestination;
};

const severityClasses: Record<
  AlertItem["severity"],
  { icon: string; panel: string; text: string }
> = {
  critical: {
    icon: "border-destructive bg-destructive/10 text-destructive",
    panel: "border-destructive/40 bg-destructive/5",
    text: "text-destructive",
  },
  info: {
    icon: "border-primary/40 bg-primary/10 text-primary",
    panel: "border-primary/35 bg-primary/5",
    text: "text-primary",
  },
  warning: {
    icon: "border-secondary bg-secondary/20 text-[oklch(0.46_0.12_80)]",
    panel: "border-secondary/70 bg-secondary/10",
    text: "text-[oklch(0.46_0.12_80)]",
  },
};

function SeverityIcon({ severity }: { severity: AlertItem["severity"] }) {
  if (severity === "critical") {
    return <ShieldAlert className="size-5" />;
  }

  if (severity === "warning") {
    return <AlertTriangle className="size-5" />;
  }

  return <Info className="size-5" />;
}

export default function AdminAlertDetailPage({ destination }: AdminAlertDetailPageProps) {
  const severityClass = severityClasses[destination.severity];

  return (
    <AdminLayout>
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mb-6">
          <Button asChild className="h-10 cursor-pointer rounded-none px-3" variant="outline">
            <Link href="/admin">
              <ArrowLeft className="size-4" />
              Quay lại dashboard
            </Link>
          </Button>
        </div>

        <section className={["border bg-background", severityClass.panel].join(" ")}>
          <div className="flex flex-col gap-5 border-b border-border px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <span
                className={[
                  "flex size-12 shrink-0 items-center justify-center border",
                  severityClass.icon,
                ].join(" ")}
              >
                <SeverityIcon severity={destination.severity} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Cảnh báo vận hành
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight">{destination.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {destination.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-0 border-b border-border md:grid-cols-3">
            {destination.metrics.map((metric) => (
              <article key={metric.label} className="border border-border bg-background/60 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {metric.label}
                </p>
                <p className="mt-2 text-sm font-black">{metric.value}</p>
              </article>
            ))}
          </div>

          <div className="px-6 py-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Hành động đề xuất
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {destination.actions.map((action, index) => (
                <Button
                  asChild
                  className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold"
                  key={action.href}
                  variant={index === 0 ? "default" : "outline"}
                >
                  <Link href={action.href}>
                    {action.label}
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </AdminLayout>
  );
}
