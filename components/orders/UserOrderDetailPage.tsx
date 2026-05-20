"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  MapPin,
  Package,
  RefreshCw,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { formatCartMoney } from "@/components/cart/cart-format";
import {
  canConfirmOrderPayment,
  formatOrderDate,
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/components/orders/order-display";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveCatalogVariantSlugById } from "@/lib/api/services/catalog-variants.service";
import { confirmMyOrderPayment, getMyOrder } from "@/lib/api/services/checkout.service";
import type { CheckoutOrder, CheckoutOrderItem } from "@/lib/checkout/types";

export default function UserOrderDetailPage({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMyOrder(orderId);
      setOrder(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải chi tiết đơn hàng.";
      setErrorMessage(message);
      setOrder(null);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isInitializing && !profile) {
      router.replace("/dang-nhap");
    }
  }, [isInitializing, profile, router]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrder, profile?.id]);

  async function handleConfirmPayment() {
    if (!order) {
      return;
    }

    setIsConfirming(true);
    const loadingToastId = toast.loading("Đang gửi xác nhận đã chuyển khoản...");

    try {
      const response = await confirmMyOrderPayment(order.id);
      setOrder(response);
      toast.success("Đã gửi xác nhận thanh toán.", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.", { id: loadingToastId });
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleOpenOrderItem(item: CheckoutOrderItem) {
    const directSlug = item.variantSlugSnapshot || item.variantSlug || item.slug;

    if (directSlug) {
      router.push(`/san-pham/${directSlug}`);
      return;
    }

    if (!item.variantId) {
      toast.error("Không thể mở chi tiết sản phẩm vì đơn hàng thiếu mã biến thể.");
      return;
    }

    const loadingToastId = toast.loading("Đang mở chi tiết sản phẩm...");

    try {
      const resolvedSlug = await resolveCatalogVariantSlugById(item.variantId);

      if (!resolvedSlug) {
        toast.error("Không tìm thấy sản phẩm tương ứng trong catalog hiện tại.", { id: loadingToastId });
        return;
      }

      toast.dismiss(loadingToastId);
      router.push(`/san-pham/${resolvedSlug}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể mở chi tiết sản phẩm.", { id: loadingToastId });
    }
  }

  if (isInitializing || !profile || isLoading) {
    return (
      <main className="border-t border-border bg-background">
        <section className="container mx-auto px-4 py-10 lg:py-12">
          <OrderDetailSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-4 py-10 lg:py-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
            <Link href="/don-hang">
              <ArrowLeft className="size-4" />
              Quay lại đơn hàng
            </Link>
          </Button>
          <Button
            className="h-9 px-3 text-xs font-semibold"
            disabled={isLoading}
            onClick={() => void loadOrder()}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>

        {errorMessage ? (
          <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-semibold">
                <AlertCircle className="size-4" />
                {errorMessage}
              </p>
              <Button className="h-9 px-3 text-xs font-semibold" onClick={() => void loadOrder()} type="button" variant="outline">
                Thử lại
              </Button>
            </div>
          </div>
        ) : order ? (
          <OrderDetail
            order={order}
            isConfirming={isConfirming}
            onConfirmPayment={handleConfirmPayment}
            onOpenOrderItem={handleOpenOrderItem}
          />
        ) : null}
      </section>
    </main>
  );
}

function OrderDetail({
  isConfirming,
  onConfirmPayment,
  onOpenOrderItem,
  order,
}: {
  isConfirming: boolean;
  onConfirmPayment: () => Promise<void>;
  onOpenOrderItem: (item: CheckoutOrderItem) => Promise<void>;
  order: CheckoutOrder;
}) {
  const shippingAddress = order.shippingAddress;
  const shippingName = shippingAddress?.name || order.customerName || "Chưa có dữ liệu";
  const shippingPhone = shippingAddress?.phoneNumber || order.customerPhone || "Chưa có dữ liệu";
  const shippingLine = shippingAddress
    ? `${shippingAddress.streetAddress}, ${shippingAddress.wardName}, ${shippingAddress.provinceName}`
    : "Chưa có dữ liệu";

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6">
      <div className="grid gap-4">
        <section className="border border-border bg-background">
          <header className="border-b border-border px-4 py-4 md:px-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Chi tiết đơn hàng
                </p>
                <h1 className="mt-2 break-words font-mono text-xl font-black tracking-tight sm:text-2xl">
                  {order.orderCode}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Đặt lúc {formatOrderDate(order.createdAt)}</p>
              </div>
              <StatusBadge label={getOrderStatusLabel(order.status)} />
            </div>
          </header>

          <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
            <StatusLine icon={<Truck className="size-4" />} label="Giao hàng" value={getFulfillmentStatusLabel(order.fulfillmentStatus)} />
            <StatusLine icon={<CreditCard className="size-4" />} label="Thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
            <StatusLine icon={<Package className="size-4" />} label="Sản phẩm" value={`${order.items.length} dòng hàng`} />
          </div>
        </section>

        <section className="border border-border bg-background p-4 md:p-5">
          <div className="flex items-start gap-3">
            <MapPin className="mt-1 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-tight">Địa chỉ nhận hàng</h2>
              <p className="mt-3 break-words text-sm font-semibold">
                {shippingName} <span className="font-normal text-muted-foreground">({shippingPhone})</span>
              </p>
              <p className="mt-1 break-words text-sm leading-6 text-muted-foreground">{shippingLine}</p>
            </div>
          </div>
        </section>

        <section className="border border-border bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Sản phẩm</h2>
            <span className="text-xs font-semibold text-muted-foreground">{order.items.length} dòng</span>
          </div>
          {order.items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">Đơn hàng chưa có dòng sản phẩm.</div>
          ) : (
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <OrderItemRow key={item.id} item={item} onOpenProduct={onOpenOrderItem} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 text-sm md:px-5">
            <span className="text-muted-foreground">Thành tiền:</span>
            <span className="text-lg font-black text-primary">{formatCartMoney(order.grandTotalAmount)}</span>
          </div>
        </section>

        <section className="border border-border bg-background p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-black tracking-tight">Mã đơn hàng</h2>
            <CopyButton text={order.orderCode} />
          </div>
          <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm">
            <Info label="Mã đơn" value={order.orderCode} mono />
            <Info label="Email nhận thông tin" value={order.customerEmail} />
            <Info label="Phương thức thanh toán" value={order.paymentMethod} />
            <Info label="Cập nhật gần nhất" value={formatOrderDate(order.updatedAt)} />
          </dl>
        </section>
      </div>

      <aside className="h-fit border border-border bg-muted/10 p-4 md:p-5 xl:sticky xl:top-24">
        <h2 className="text-base font-black tracking-tight">Thanh toán</h2>
        <dl className="mt-4 grid gap-3 border-b border-border pb-4 text-sm">
          <Info label="Tổng tiền" value={formatCartMoney(order.grandTotalAmount)} strong />
          <Info label="Ngân hàng" value={order.paymentBankName || order.paymentBankCode || "Chưa có dữ liệu"} />
          <Info label="Số tài khoản" value={order.paymentBankAccountNumber || "Chưa có dữ liệu"} mono />
          <Info label="Chủ tài khoản" value={order.paymentBankAccountName || "Chưa có dữ liệu"} />
          <Info label="Nội dung chuyển khoản" value={order.paymentTransferContent || "Chưa có dữ liệu"} mono />
        </dl>

        {order.paymentQrUrl ? (
          <Image
            alt={`QR thanh toán đơn ${order.orderCode}`}
            className="mt-4 h-auto w-full border border-border bg-background"
            height={320}
            src={order.paymentQrUrl}
            width={320}
          />
        ) : null}

        {canConfirmOrderPayment(order) ? (
          <Button
            className="mt-4 h-11 w-full cursor-pointer text-sm font-semibold"
            disabled={isConfirming}
            onClick={() => void onConfirmPayment()}
            type="button"
          >
            <CheckCircle2 className="size-4" />
            Tôi đã chuyển khoản
          </Button>
        ) : null}
      </aside>
    </div>
  );
}

function OrderItemRow({
  item,
  onOpenProduct,
}: {
  item: CheckoutOrderItem;
  onOpenProduct: (item: CheckoutOrderItem) => Promise<void>;
}) {
  const productName = item.productNameSnapshot || item.productName || "Sản phẩm";
  const variantName = item.variantNameSnapshot || item.variantName || productName;
  const sku = item.skuSnapshot || item.sku || "Chưa có dữ liệu";
  const unit = item.unitSnapshot || "sản phẩm";
  const unitPrice = item.effectivePriceSnapshot ?? item.salePriceSnapshot ?? item.priceSnapshot;
  const lineTotal = item.totalAmount ?? item.subtotalAmount;

  return (
    <article className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_180px] md:items-center md:p-5">
      <button
        type="button"
        className="grid min-w-0 cursor-pointer grid-cols-[72px_minmax(0,1fr)] gap-3 text-left transition-colors hover:text-primary"
        onClick={() => void onOpenProduct(item)}
      >
        <div className="flex size-[72px] items-center justify-center border border-border bg-muted/15">
          {item.imageUrlSnapshot ? (
            <Image
              alt={variantName}
              className="object-cover"
              height={72}
              src={item.imageUrlSnapshot}
              width={72}
            />
          ) : (
            <Package className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{variantName}</p>
          {variantName !== productName ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">{productName}</p>
          ) : null}
          <p className="mt-1 truncate font-mono text-[11px] font-semibold text-muted-foreground">{sku}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {unit} x{item.quantity ?? 0}
          </p>
        </div>
      </button>
      <div className="grid grid-cols-2 items-end gap-3 md:block md:text-right">
        <div className="text-sm md:mb-2">
          <p className="text-xs text-muted-foreground">Đơn giá</p>
          <p className="whitespace-nowrap font-semibold">{formatCartMoney(unitPrice)}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-xs text-muted-foreground">Thành tiền</p>
          <p className="whitespace-nowrap font-black text-primary">{formatCartMoney(lineTotal)}</p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-8 w-fit max-w-full items-center whitespace-nowrap border border-primary bg-primary px-2.5 text-xs font-semibold text-primary-foreground">
      {label}
    </span>
  );
}

function StatusLine({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border border-border bg-muted/10 p-3">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép mã đơn hàng.");
    } catch {
      toast.error("Không thể sao chép mã đơn hàng.");
    }
  }

  return (
    <Button className="h-9 cursor-pointer px-3 text-xs font-semibold" onClick={() => void handleCopy()} type="button" variant="outline">
      <Copy className="size-4" />
      Sao chép
    </Button>
  );
}

function Info({
  label,
  mono = false,
  strong = false,
  value,
}: {
  label: string;
  mono?: boolean;
  strong?: boolean;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 break-words ${mono ? "font-mono" : ""} ${strong ? "text-lg font-black text-primary" : "font-semibold"}`}>
        {value}
      </dd>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="border border-border p-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-3 h-8 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-48" />
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`order-detail-skeleton-${index}`} className="flex items-start gap-3 border border-border p-4">
              <Package className="mt-1 size-5 text-muted-foreground" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <aside className="border border-border p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-4 aspect-square w-full" />
      </aside>
    </div>
  );
}
