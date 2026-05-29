import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import StatusShell from "@/components/common/StatusShell";
import { Button } from "@/components/ui/button";

type ComingSoonViewProps = {
  area?: string;
  summary?: string;
  title: string;
};

export default function ComingSoonView({
  area = "ShopAHSO",
  summary = "Khu vực này đang được chuẩn bị để đảm bảo thông tin chính xác, luồng thao tác rõ ràng và trải nghiệm ổn định trước khi mở cho người dùng.",
  title,
}: ComingSoonViewProps) {
  return (
    <StatusShell
      badge="Sắp ra mắt"
      eyebrow="Trạng thái triển khai"
      title={title}
      summary={summary}
      metrics={[
        { label: "Khu vực", value: area },
        { label: "Trạng thái", value: "Đang hoàn thiện nội dung và kiểm thử" },
        { label: "Ưu tiên", value: "Giữ điều hướng rõ ràng, không để người dùng gặp trang lỗi" },
      ]}
      actions={[
        {
          key: "catalog",
          element: (
            <Button asChild size="lg" className="h-11 px-5 text-sm font-semibold">
              <Link href="/san-pham">
                <ClipboardList className="size-4" />
                Xem danh mục sản phẩm
              </Link>
            </Button>
          ),
        },
        {
          key: "back",
          element: (
            <Button asChild size="lg" variant="outline" className="h-11 px-5 text-sm font-semibold">
              <Link href="/">
                <ArrowLeft className="size-4" />
                Về trang chính
              </Link>
            </Button>
          ),
        },
      ]}
    />
  );
}
