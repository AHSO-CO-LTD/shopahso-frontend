import type { ReactNode } from "react";
import DashboardSectionHeader from "@/components/dashboard/DashboardSectionHeader";
import type { DashboardWorkstream } from "@/components/dashboard/types";

type DashboardWorkstreamListProps = {
  overline: string;
  title: string;
  items: DashboardWorkstream[];
  suffix?: ReactNode;
};

export default function DashboardWorkstreamList({
  overline,
  title,
  items,
  suffix,
}: DashboardWorkstreamListProps) {
  return (
    <section className="border border-border bg-background">
      <DashboardSectionHeader overline={overline} suffix={suffix} title={title} />
      <div className="divide-y divide-border">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="grid gap-4 px-6 py-5 lg:grid-cols-[48px_minmax(0,1fr)_140px] lg:items-start"
            >
              <div className="flex size-12 items-center justify-center border border-border bg-muted/20">
                <Icon className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                {item.summary ? (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                ) : null}
              </div>
              <div className="flex items-start lg:justify-end">
                <span className="border border-border bg-background px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground">
                  {item.status}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
