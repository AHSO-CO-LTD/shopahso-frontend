"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { FileText, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/AuthProvider";
import { createQuoteRequest } from "@/lib/api/services/quote-requests.service";
import type { CatalogVariant } from "@/lib/catalog/types";
import {
  clearStoredQuoteRequestContact,
  getStoredQuoteRequestContact,
  setStoredQuoteRequestContact,
  type StoredQuoteRequestContact,
} from "@/lib/quote-request/storage";

type QuoteRequestFormValue = StoredQuoteRequestContact;

type QuoteRequestModalProps = {
  open: boolean;
  variant: CatalogVariant | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const EMPTY_FORM: QuoteRequestFormValue = {
  fullName: "",
  email: "",
  phoneNumber: "",
  quantity: 1,
  note: "",
};

function getInitialFormValue(variant: CatalogVariant | null, profile: ReturnType<typeof useAuth>["profile"]) {
  const minQuantity = Math.max(variant?.minOrderQuantity ?? 1, 1);

  return {
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    phoneNumber: profile?.phoneNumber ?? "",
    quantity: minQuantity,
    note: "",
  };
}

function normalizeFormValue(value: QuoteRequestFormValue, variant: CatalogVariant | null) {
  const minQuantity = Math.max(variant?.minOrderQuantity ?? 1, 1);
  const quantity = Number(value.quantity);

  return {
    fullName: value.fullName.trim(),
    email: value.email.trim(),
    phoneNumber: value.phoneNumber.trim(),
    quantity: Number.isFinite(quantity) ? Math.max(Math.floor(quantity), minQuantity) : minQuantity,
    note: value.note.trim(),
  };
}

function validateFormValue(value: QuoteRequestFormValue) {
  if (!value.fullName.trim() || !value.email.trim() || !value.phoneNumber.trim()) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim());
}

export default function QuoteRequestModal({
  onClose,
  onSuccess,
  open,
  variant,
}: QuoteRequestModalProps) {
  const { isAuthenticated, profile } = useAuth();
  const [formValue, setFormValue] = useState<QuoteRequestFormValue>(EMPTY_FORM);
  const [rememberForOneHour, setRememberForOneHour] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const autoSubmittedVariantId = useRef<string | null>(null);

  const minQuantity = Math.max(variant?.minOrderQuantity ?? 1, 1);
  const productName = variant?.product.name ?? "Sản phẩm";
  const variantName = variant?.name ?? "Biến thể cần báo giá";

  const resetForm = useCallback(() => {
    setFormValue(getInitialFormValue(variant, profile));
    setRememberForOneHour(false);
  }, [profile, variant]);

  const submitQuoteRequest = useCallback(async (
    value: QuoteRequestFormValue,
    options?: { remember: boolean; auto?: boolean },
  ) => {
    if (!variant) {
      toast.warning("Vui lòng chọn sản phẩm cần báo giá.");
      return false;
    }

    const normalizedValue = normalizeFormValue(value, variant);

    if (!validateFormValue(normalizedValue)) {
      toast.warning("Vui lòng kiểm tra lại thông tin yêu cầu báo giá.");
      return false;
    }

    const loadingToastId = toast.loading("Đang gửi yêu cầu báo giá...");

    try {
      setIsSubmitting(true);
      if (options?.auto) {
        setIsAutoSubmitting(true);
      }

      const response = await createQuoteRequest({
        variantIds: [variant.id],
        fullName: normalizedValue.fullName,
        email: normalizedValue.email,
        phoneNumber: normalizedValue.phoneNumber,
        quantity: normalizedValue.quantity,
        note: normalizedValue.note || undefined,
      });

      if (options?.remember) {
        setStoredQuoteRequestContact(normalizedValue);
      } else {
        clearStoredQuoteRequestContact();
      }

      toast.success(`Yêu cầu báo giá đã được ghi nhận. Mã nhóm: ${response.requestGroupCode}`, {
        id: loadingToastId,
      });
      onSuccess?.();
      onClose();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vui lòng kiểm tra lại thông tin yêu cầu báo giá.", {
        id: loadingToastId,
      });
      setFormValue(normalizedValue);
      return false;
    } finally {
      setIsSubmitting(false);
      setIsAutoSubmitting(false);
    }
  }, [onClose, onSuccess, variant]);

  useEffect(() => {
    if (!open || !variant) {
      autoSubmittedVariantId.current = null;
      return;
    }

    const storedContact = getStoredQuoteRequestContact();
    if (storedContact && autoSubmittedVariantId.current !== variant.id) {
      autoSubmittedVariantId.current = variant.id;
      setFormValue(storedContact);
      setRememberForOneHour(true);
      void submitQuoteRequest(storedContact, { auto: true, remember: true });
      return;
    }

    resetForm();
  }, [open, resetForm, submitQuoteRequest, variant]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose, open]);

  const canSubmit = useMemo(
    () => Boolean(variant && validateFormValue(formValue) && !isSubmitting),
    [formValue, isSubmitting, variant],
  );

  function updateField<Key extends keyof QuoteRequestFormValue>(field: Key, value: QuoteRequestFormValue[Key]) {
    setFormValue((currentValue) => ({
      ...currentValue,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuoteRequest(formValue, { remember: rememberForOneHour });
  }

  if (typeof document === "undefined" || !open || !variant) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/25 px-3 py-5 sm:px-4"
      role="dialog"
    >
      <form
        className="max-h-[calc(100vh-40px)] w-full max-w-2xl overflow-y-auto border border-border bg-background"
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Yêu cầu báo giá
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{variantName}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{productName} | SKU {variant.sku}</p>
          </div>
          <Button
            aria-label="Đóng form báo giá"
            className="size-9 shrink-0 cursor-pointer rounded-none px-0"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
            variant="outline"
          >
            <X className="size-4" />
          </Button>
        </div>

        {isAutoSubmitting ? (
          <div className="border-b border-border bg-muted/20 px-4 py-3 text-sm font-semibold text-muted-foreground sm:px-5">
            Đang gửi nhanh bằng thông tin đã lưu trong 1 giờ.
          </div>
        ) : null}

        <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 sm:py-5">
          <TextField
            autoComplete="name"
            label="Họ và tên"
            required
            value={formValue.fullName}
            onChange={(value) => updateField("fullName", value)}
          />
          <TextField
            autoComplete="email"
            label="Email"
            required
            type="email"
            value={formValue.email}
            onChange={(value) => updateField("email", value)}
          />
          <TextField
            autoComplete="tel"
            label="Số điện thoại"
            required
            value={formValue.phoneNumber}
            onChange={(value) => updateField("phoneNumber", value)}
          />
          <TextField
            label="Số lượng"
            min={minQuantity}
            required
            type="number"
            value={String(formValue.quantity)}
            onChange={(value) => updateField("quantity", Number(value))}
          />
          <label className="grid gap-2 text-sm sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ghi chú
            </span>
            <textarea
              className="min-h-24 resize-y border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-primary/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
              disabled={isSubmitting}
              maxLength={500}
              onChange={(event) => updateField("note", event.target.value)}
              placeholder="Ví dụ: cần báo giá trong giờ hành chính, số lượng dự kiến..."
              value={formValue.note}
            />
          </label>
        </div>

        <div className="border-t border-border px-4 py-4 sm:px-5">
          <label className="flex cursor-pointer items-start gap-3 border border-border bg-muted/10 p-3 text-sm transition-colors hover:border-primary/70">
            <input
              checked={rememberForOneHour}
              className="mt-0.5 size-4 accent-primary"
              disabled={isSubmitting}
              onChange={(event) => setRememberForOneHour(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block font-semibold">Không hỏi lại trong vòng 1 giờ</span>
              <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                Lần sau hệ thống sẽ gửi nhanh bằng thông tin này cho sản phẩm cần báo giá.
              </span>
            </span>
          </label>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {isAuthenticated ? (
                <Link className="font-semibold text-primary hover:underline" href="/tai-khoan/yeu-cau-bao-gia">
                  Xem yêu cầu báo giá của tôi
                </Link>
              ) : (
                <span>Đăng nhập giúp hệ thống tự gắn yêu cầu vào tài khoản của bạn.</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold"
                disabled={isSubmitting}
                onClick={onClose}
                type="button"
                variant="outline"
              >
                Đóng
              </Button>
              <Button
                className="h-10 cursor-pointer rounded-none px-4 text-sm font-semibold"
                disabled={!canSubmit}
                type="submit"
              >
                {isSubmitting ? <FileText className="size-4" /> : <Send className="size-4" />}
                {isSubmitting ? "Đang gửi" : "Gửi yêu cầu"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function TextField({
  autoComplete,
  label,
  min,
  onChange,
  required = false,
  type = "text",
  value,
}: {
  autoComplete?: string;
  label: string;
  min?: number;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        autoComplete={autoComplete}
        className="h-11 min-w-0 border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 hover:border-primary/70 focus:border-primary focus:ring-2 focus:ring-primary/15"
        min={min}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        type={type}
        value={value}
      />
    </label>
  );
}
