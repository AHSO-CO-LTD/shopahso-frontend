import type { DashboardPanel } from "@/components/dashboard/types";

type DashboardActionPanelGridProps = {
  panels: DashboardPanel[];
};

export default function DashboardActionPanelGrid({
  panels,
}: DashboardActionPanelGridProps) {
  return (
    <section className="grid gap-0 border border-border bg-background lg:grid-cols-2 2xl:grid-cols-4">
      {panels.map((panel) => {
        const Icon = panel.icon;

        return (
          <article key={panel.title} className="border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center border border-border bg-muted/20">
                <Icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Chức năng
                </p>
                <h3 className="mt-1 text-xl font-black tracking-tight">{panel.title}</h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {panel.items.map((item) => (
                <div
                  key={item}
                  className="border border-border px-4 py-3 text-sm text-muted-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
