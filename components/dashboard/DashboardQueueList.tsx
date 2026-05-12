import DashboardSectionHeader from "@/components/dashboard/DashboardSectionHeader";
import type { DashboardQueueItem } from "@/components/dashboard/types";

type DashboardQueueListProps = {
  overline: string;
  title: string;
  items: DashboardQueueItem[];
};

export default function DashboardQueueList({
  overline,
  title,
  items,
}: DashboardQueueListProps) {
  return (
    <aside className="border border-border bg-background">
      <DashboardSectionHeader overline={overline} title={title} />
      <div className="divide-y divide-border">
        {items.map((item) => (
          <article key={item.title} className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-black tracking-tight">{item.title}</h3>
              <div className="min-w-[72px] border border-border bg-muted/20 px-4 py-3 text-center text-2xl font-black tracking-tight">
                {item.value}
              </div>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
