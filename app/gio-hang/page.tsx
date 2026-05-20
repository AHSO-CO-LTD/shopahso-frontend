import { CartContent } from "@/components/cart/CartContent";

export const metadata = {
  title: "Giỏ hàng | ShopAHSO",
};

export default function CartPage() {
  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Đơn hàng tạm thời
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-4xl">Giỏ hàng</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Kiểm tra giá hiện tại, số lượng tồn kho và trạng thái khả dụng trước khi đặt hàng.
            </p>
          </div>
        </header>

        <CartContent />
      </section>
    </main>
  );
}
