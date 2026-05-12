import type { DashboardMetric } from "@/components/dashboard/types";

type DashboardMetricGridProps = {
  metrics: DashboardMetric[];
};

export default function DashboardMetricGrid({ metrics }: DashboardMetricGridProps) {
  return (
    <section className="grid gap-0 border border-border bg-background md:grid-cols-2 2xl:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="border border-border px-6 py-6">
          <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
          <p className="mt-5 text-4xl font-black tracking-tight">{metric.value}</p>
        </article>
      ))}
    </section>
  );
}
