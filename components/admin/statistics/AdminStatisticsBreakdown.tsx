import {
  formatCompactNumber,
  getStatisticsBreakdownLabel,
} from "@/components/admin/statistics/statistics-format";

type BreakdownItem = {
  key: string;
  label: string;
  value: number;
};

type AdminStatisticsBreakdownProps = {
  items: BreakdownItem[];
  title: string;
};

const barColors: Record<string, string> = {
  ACTIVE: "bg-[oklch(0.58_0.18_145)]",
  ADMIN: "bg-primary",
  CANCELLED: "bg-destructive",
  CLOSED: "bg-[oklch(0.58_0.18_145)]",
  CONFIRMED: "bg-primary",
  DRAFT: "bg-secondary",
  IN_STOCK: "bg-[oklch(0.58_0.18_145)]",
  OUT_OF_STOCK: "bg-destructive",
  PAID: "bg-[oklch(0.58_0.18_145)]",
  PENDING: "bg-secondary",
  QUOTED: "bg-primary",
  REJECTED: "bg-destructive",
  STAFF: "bg-secondary",
  UNPAID: "bg-secondary",
  USER: "bg-[oklch(0.58_0.18_145)]",
};

const valueColors: Record<string, string> = {
  CANCELLED: "text-destructive",
  OUT_OF_STOCK: "text-destructive",
  PAID: "text-[oklch(0.36_0.14_145)]",
  PENDING: "text-[oklch(0.46_0.12_80)]",
  REJECTED: "text-destructive",
};

export default function AdminStatisticsBreakdown({
  items,
  title,
}: AdminStatisticsBreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Phân bổ
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight">{title}</h3>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-border">
          {items.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <article key={item.key} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold">
                    {getStatisticsBreakdownLabel(item.key, item.label)}
                  </p>
                  <p
                    className={[
                      "font-mono text-sm font-bold",
                      valueColors[item.key] ?? "text-foreground",
                    ].join(" ")}
                  >
                    {formatCompactNumber(item.value)}
                  </p>
                </div>
                <div className="mt-3 h-2 border border-border bg-muted/20">
                  <div
                    className={["h-full", barColors[item.key] ?? "bg-primary"].join(" ")}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-muted-foreground">
          Chưa có dữ liệu phân bổ.
        </div>
      )}
    </section>
  );
}
