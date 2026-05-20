import { Suspense } from "react";
import { OrderLookupPage } from "@/components/orders/OrderLookupPage";

export default function OrderLookupRoute() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
      <Suspense fallback={<div className="border border-border p-5 text-sm text-muted-foreground">Đang tải tra cứu...</div>}>
        <OrderLookupPage />
      </Suspense>
    </main>
  );
}
