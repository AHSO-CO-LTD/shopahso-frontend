import Image from "next/image";
import type { TopVariant } from "@/lib/admin-statistics/types";
import { formatCompactNumber, formatMoney } from "@/components/admin/statistics/statistics-format";

type AdminStatisticsTopVariantsProps = {
  items: TopVariant[];
  title: string;
};

function getPriceStatus(item: TopVariant) {
  if (item.contactForPrice) {
    return "Liên hệ báo giá";
  }

  return item.price ? formatMoney(item.price) : "Chưa có giá";
}

function StatusBadge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const className = {
    danger: "border-destructive bg-destructive/8 text-destructive",
    neutral: "border-border bg-muted/20 text-muted-foreground",
    success:
      "border-[oklch(0.58_0.18_145)] bg-[oklch(0.58_0.18_145_/_0.08)] text-[oklch(0.36_0.14_145)]",
    warning: "border-secondary bg-secondary/20 text-[oklch(0.46_0.12_80)]",
  }[tone];

  return (
    <span className={["inline-flex border px-2 py-1 text-[11px] font-bold", className].join(" ")}>
      {children}
    </span>
  );
}

export default function AdminStatisticsTopVariants({
  items,
  title,
}: AdminStatisticsTopVariantsProps) {
  return (
    <section className="border border-border bg-background">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Top sản phẩm
        </p>
        <h3 className="mt-1 text-base font-black tracking-tight">{title}</h3>
      </div>

      {items.length > 0 ? (
        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <article
              key={`${item.id}-${item.metricKey}`}
              className={[
                "grid gap-4 px-5 py-4 xl:grid-cols-[36px_56px_minmax(0,1fr)_120px_110px_140px] xl:items-center",
                item.isInStock ? "bg-background" : "bg-destructive/5",
              ].join(" ")}
            >
              <p className="font-mono text-sm font-bold text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <div className="relative size-14 border border-border bg-muted/30">
                {item.imageUrl ? (
                  <Image
                    alt={item.name}
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={item.imageUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase text-muted-foreground">
                    N/A
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-black tracking-tight">{item.name}</h4>
                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {item.sku || "Chưa có SKU"} · {item.productName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Chỉ số
                </p>
                <p className="mt-1 font-mono text-sm font-black text-primary">
                  {formatCompactNumber(item.metricValue)}
                </p>
                {item.revenue ? (
                  <p className="mt-1 text-xs font-semibold text-[oklch(0.36_0.14_145)]">
                    {formatMoney(item.revenue)}
                  </p>
                ) : null}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Tồn kho
                </p>
                <p
                  className={[
                    "mt-1 font-mono text-sm font-black",
                    item.isInStock ? "text-[oklch(0.36_0.14_145)]" : "text-destructive",
                  ].join(" ")}
                >
                  {formatCompactNumber(item.stockQuantity)}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={item.isInStock ? "success" : "danger"}>
                    {item.isInStock ? "Còn hàng" : "Hết hàng"}
                  </StatusBadge>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Giá
                </p>
                <p
                  className={[
                    "mt-1 text-sm font-black",
                    item.contactForPrice ? "text-[oklch(0.46_0.12_80)]" : "text-foreground",
                  ].join(" ")}
                >
                  {getPriceStatus(item)}
                </p>
                <div className="mt-2">
                  <StatusBadge tone={item.isActive ? "success" : "neutral"}>
                    {item.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
                  </StatusBadge>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-10 text-sm text-muted-foreground">
          Chưa có dữ liệu sản phẩm trong khoảng thời gian này.
        </div>
      )}
    </section>
  );
}
