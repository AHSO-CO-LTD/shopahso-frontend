import { ClipboardCheck, FileText, PackageCheck, Search, Truck } from "lucide-react";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";

const BUYING_STEPS = [
  {
    body: "Nhập SKU, tên hàng, model hoặc thương hiệu để lọc catalog.",
    icon: Search,
    title: "Tìm sản phẩm",
  },
  {
    body: "Mở chi tiết, đối chiếu hình ảnh, giá tham chiếu và thông tin hãng.",
    icon: ClipboardCheck,
    title: "Kiểm tra thông tin",
  },
  {
    body: "Thêm vào giỏ hoặc gửi yêu cầu báo giá nếu cần xác nhận số lượng lớn.",
    icon: FileText,
    title: "Chốt nhu cầu",
  },
  {
    body: "Theo dõi xử lý đơn hàng, giao hàng và bảo hành trong tài khoản.",
    icon: Truck,
    title: "Nhận hàng",
  },
];

export default function HomeBuyingProcess() {
  return (
    <section className="border-b border-border bg-background py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <HomeSectionHeader
          description=""
          eyebrow="06 / Buying process"
          title="Quy trình mua hàng"
        />

        <div className="mt-5 grid border border-border bg-background sm:grid-cols-2 lg:grid-cols-4">
          {BUYING_STEPS.map((step, index) => {
            const Icon = step.icon;

            return (
              <article
                key={step.title}
                className="min-h-48 border-b border-r border-border p-5 last:border-r-0 sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-8 text-base font-black">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 border border-border bg-muted/20 px-4 py-3 text-sm font-semibold">
          <PackageCheck className="size-4 text-primary" />
          Mọi thao tác đều có phản hồi rõ ràng qua giao diện và thông báo hệ thống.
        </div>
      </div>
    </section>
  );
}
