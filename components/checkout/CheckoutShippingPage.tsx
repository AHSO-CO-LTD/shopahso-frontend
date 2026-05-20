"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { createCheckoutOrder } from "@/lib/api/services/checkout.service";
import { listUserAddresses } from "@/lib/api/services/user-addresses.service";
import { getWardsByProvinceCode, provinceOptions } from "@/lib/address/vietnam-locations";
import {
  getStoredCheckoutItemIds,
  getStoredCheckoutPreview,
  setStoredCheckoutOrder,
} from "@/lib/checkout/storage";
import type { CheckoutPreview, CheckoutShippingAddress } from "@/lib/checkout/types";
import type { UserAddress } from "@/lib/user-address/types";

type ShippingForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressId: string;
  provinceCode: string;
  wardCode: string;
  streetAddress: string;
  note: string;
  customerNote: string;
};

function getDefaultForm(): ShippingForm {
  return {
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    addressId: "",
    provinceCode: "",
    wardCode: "",
    streetAddress: "",
    note: "",
    customerNote: "",
  };
}

export function CheckoutShippingPage() {
  const router = useRouter();
  const { isAuthenticated, isInitializing, profile } = useAuth();
  const { refreshCart } = useCart();
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [cartItemIds, setCartItemIds] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [form, setForm] = useState<ShippingForm>(getDefaultForm);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProvince = useMemo(
    () => provinceOptions.find((province) => province.code === form.provinceCode) ?? null,
    [form.provinceCode],
  );
  const wardOptions = useMemo(() => getWardsByProvinceCode(form.provinceCode), [form.provinceCode]);
  const selectedWard = useMemo(
    () => wardOptions.find((ward) => ward.code === form.wardCode) ?? null,
    [form.wardCode, wardOptions],
  );
  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === form.addressId) ?? null,
    [addresses, form.addressId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedPreview = getStoredCheckoutPreview();
      const storedItemIds = getStoredCheckoutItemIds();

      setPreview(storedPreview);
      setCartItemIds(storedItemIds);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isInitializing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm((current) => ({
        ...current,
        customerName: current.customerName || profile?.fullName || "",
        customerEmail: current.customerEmail || profile?.email || "",
        customerPhone: current.customerPhone || profile?.phoneNumber || "",
      }));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isInitializing, profile]);

  useEffect(() => {
    if (!isAuthenticated || isInitializing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsLoadingAddresses(true);
      listUserAddresses()
        .then((response) => {
          setAddresses(response);
          const defaultAddress = response.find((address) => address.status) ?? response[0];
          if (defaultAddress) {
            setForm((current) => ({
              ...current,
              addressId: current.addressId || defaultAddress.id,
              customerName: current.customerName || defaultAddress.name,
              customerPhone: current.customerPhone || defaultAddress.phoneNumber || "",
            }));
          }
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Không thể tải địa chỉ đã lưu.");
        })
        .finally(() => setIsLoadingAddresses(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isAuthenticated, isInitializing]);

  function validateForm() {
    if (cartItemIds.length === 0) {
      return "Không tìm thấy sản phẩm checkout. Vui lòng quay lại giỏ hàng.";
    }
    if (!form.customerName.trim()) {
      return "Vui lòng nhập tên người nhận.";
    }
    if (!form.customerEmail.trim()) {
      return "Vui lòng nhập email nhận thông tin đơn hàng.";
    }
    if (!isAuthenticated && !form.customerPhone.trim()) {
      return "Vui lòng nhập số điện thoại.";
    }
    if (isAuthenticated && form.addressId) {
      return null;
    }
    if (!selectedProvince || !selectedWard || !form.streetAddress.trim()) {
      return "Vui lòng nhập đầy đủ địa chỉ giao hàng.";
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    const manualAddress: CheckoutShippingAddress | undefined =
      !isAuthenticated || !form.addressId
        ? {
            name: form.customerName.trim(),
            phoneNumber: form.customerPhone.trim(),
            provinceCode: form.provinceCode,
            provinceName: selectedProvince?.name ?? "",
            wardCode: form.wardCode,
            wardName: selectedWard?.name ?? "",
            streetAddress: form.streetAddress.trim(),
            note: form.note.trim() || undefined,
          }
        : undefined;

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang tạo đơn hàng...");

    try {
      const order = await createCheckoutOrder({
        cartItemIds,
        customerEmail: form.customerEmail.trim(),
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || undefined,
        customerNote: form.customerNote.trim() || undefined,
        invoiceRequested: false,
        shippingAddressId: isAuthenticated && form.addressId ? form.addressId : undefined,
        shippingAddress: manualAddress,
      });

      setStoredCheckoutOrder(order);
      toast.success("Đã tạo đơn hàng.", { id: loadingToastId });
      await refreshCart();
      router.push("/checkout/payment");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo đơn hàng.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!preview) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Chưa có bản checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vui lòng quay lại bước xem trước để hệ thống kiểm tra giỏ hàng.</p>
        <Button className="mt-5 h-10 px-4" onClick={() => router.push("/checkout/preview")} type="button">
          Quay lại bước 1
        </Button>
      </div>
    );
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleSubmit}>
      <section className="space-y-4">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bước 2</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Thông tin giao hàng</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Email bên dưới là email nhận thông tin đơn hàng, có thể khác email tài khoản.
          </p>
        </div>

        <section className="grid gap-4 border border-border bg-background p-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Người nhận</span>
            <input
              className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Email nhận thông tin đơn hàng
            </span>
            <input
              className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
              type="email"
              value={form.customerEmail}
              onChange={(event) => setForm((current) => ({ ...current, customerEmail: event.target.value }))}
            />
          </label>
          <label className="grid gap-2 text-sm md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Số điện thoại</span>
            <input
              className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
              value={form.customerPhone}
              onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
            />
          </label>
        </section>

        {isAuthenticated ? (
          <section className="border border-border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <h2 className="font-black tracking-tight">Địa chỉ đã lưu</h2>
            </div>
            {isLoadingAddresses ? (
              <p className="text-sm text-muted-foreground">Đang tải địa chỉ...</p>
            ) : addresses.length > 0 ? (
              <select
                className="h-11 w-full cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                value={form.addressId}
                onChange={(event) => setForm((current) => ({ ...current, addressId: event.target.value }))}
              >
                <option value="">Nhập địa chỉ mới cho đơn này</option>
                {addresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label} | {address.name} | {address.streetAddress}, {address.wardName}, {address.provinceName}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-muted-foreground">Bạn chưa có địa chỉ đã lưu. Hãy nhập địa chỉ mới bên dưới.</p>
            )}
          </section>
        ) : null}

        {!isAuthenticated || !selectedAddress ? (
          <section className="grid gap-4 border border-border bg-background p-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Tỉnh/thành phố</span>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                value={form.provinceCode}
                onChange={(event) =>
                  setForm((current) => ({ ...current, provinceCode: event.target.value, wardCode: "" }))
                }
              >
                <option value="">Chọn tỉnh/thành phố</option>
                {provinceOptions.map((province) => (
                  <option key={province.code} value={province.code}>
                    {province.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Phường/xã</span>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!form.provinceCode}
                value={form.wardCode}
                onChange={(event) => setForm((current) => ({ ...current, wardCode: event.target.value }))}
              >
                <option value="">Chọn phường/xã</option>
                {wardOptions.map((ward) => (
                  <option key={ward.code} value={ward.code}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Số nhà, tên đường</span>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                value={form.streetAddress}
                onChange={(event) => setForm((current) => ({ ...current, streetAddress: event.target.value }))}
              />
            </label>
            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ghi chú giao hàng</span>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              />
            </label>
          </section>
        ) : null}

        <label className="grid gap-2 border border-border bg-background p-4 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ghi chú đơn hàng</span>
          <textarea
            className="min-h-24 border border-border bg-background p-3 outline-none focus:border-primary"
            value={form.customerNote}
            onChange={(event) => setForm((current) => ({ ...current, customerNote: event.target.value }))}
          />
        </label>
      </section>

      <aside className="space-y-3">
        <CheckoutSummary summary={preview.summary} />
        <Button className="h-11 w-full text-sm font-semibold" disabled={isSubmitting} type="submit">
          Tạo đơn và thanh toán
          <ArrowRight className="size-4" />
        </Button>
      </aside>
    </form>
  );
}
