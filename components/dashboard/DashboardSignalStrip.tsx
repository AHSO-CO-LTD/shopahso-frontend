import type { DashboardSignal } from "@/components/dashboard/types";

type DashboardSignalStripProps = {
  signals: DashboardSignal[];
};

export default function DashboardSignalStrip({ signals }: DashboardSignalStripProps) {
  return (
    <section className="grid gap-0 border border-border sm:grid-cols-3">
      {signals.map((signal) => (
        <article key={signal.label} className="border border-border bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {signal.label}
          </p>
          <p className="mt-3 text-sm font-semibold">{signal.value}</p>
        </article>
      ))}
    </section>
  );
}
