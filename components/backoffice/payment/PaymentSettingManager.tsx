"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Pencil,
  QrCode,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createBackofficePaymentSetting,
  deleteBackofficePaymentSetting,
  listBackofficePaymentSettings,
  testBackofficeVietQrPayment,
  updateBackofficePaymentSetting,
} from "@/lib/api/services/payment-settings.service";
import type { PaymentSetting, PaymentSettingPayload, VietQrBank, VietQrPaymentPreview } from "@/lib/payment/types";
import { fetchVietQrBanks } from "@/lib/payment/vietqr-banks";

type PaymentSettingForm = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrTemplate: string;
  transferContentTemplate: string;
  active: boolean;
};

const DEFAULT_FORM: PaymentSettingForm = {
  bankCode: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
  qrTemplate: "",
  transferContentTemplate: "",
  active: false,
};

const QR_TEMPLATE_OPTIONS = ["compact", "compact2", "qr_only", "print"];

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function validateSettingPayload(payload: PaymentSettingForm) {
  if (!payload.bankCode.trim()) {
    return "Vui lòng nhập mã ngân hàng.";
  }

  if (!payload.bankName.trim()) {
    return "Vui lòng nhập tên ngân hàng.";
  }

  if (!payload.accountNumber.trim()) {
    return "Vui lòng nhập số tài khoản.";
  }

  if (!payload.accountName.trim()) {
    return "Vui lòng nhập tên chủ tài khoản.";
  }

  if (payload.qrTemplate.trim().length > 50) {
    return "Vui lòng chọn mẫu QR.";
  }

  if (payload.transferContentTemplate.trim().length > 120) {
    return "Vui lòng nhập mẫu nội dung chuyển khoản.";
  }

  return null;
}

function buildPayload(form: PaymentSettingForm, includeInactiveState = false): PaymentSettingPayload {
  const payload: PaymentSettingPayload = {
    bankCode: form.bankCode.trim(),
    bankName: form.bankName.trim(),
    accountNumber: form.accountNumber.trim(),
    accountName: form.accountName.trim(),
  };

  if (form.qrTemplate.trim()) {
    payload.qrTemplate = form.qrTemplate.trim();
  }

  if (form.transferContentTemplate.trim()) {
    payload.transferContentTemplate = form.transferContentTemplate.trim();
  }

  if (form.active || includeInactiveState) {
    payload.active = form.active;
  }

  return payload;
}

function getSettingLabel(setting: PaymentSetting) {
  return `${setting.bankName} | ${setting.accountNumber}`;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function PaymentSettingManager({ surface }: { surface: "admin" | "staff" }) {
  const [settings, setSettings] = useState<PaymentSetting[]>([]);
  const [form, setForm] = useState<PaymentSettingForm>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testAmount, setTestAmount] = useState("10000");
  const [testNote, setTestNote] = useState("TEST QR AHSO");
  const [testResult, setTestResult] = useState<VietQrPaymentPreview | null>(null);
  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [isLoadingBanks, setIsLoadingBanks] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const activeSetting = useMemo(() => settings.find((setting) => setting.active) ?? null, [settings]);
  const selectedBank = useMemo(
    () => banks.find((bank) => bank.bin === form.bankCode || bank.code === form.bankCode) ?? null,
    [banks, form.bankCode],
  );
  const filteredBanks = useMemo(() => {
    const keyword = normalizeSearch(bankSearch.trim());

    if (!keyword) {
      return banks;
    }

    return banks.filter((bank) =>
      normalizeSearch(`${bank.bin} ${bank.code} ${bank.shortName} ${bank.name}`).includes(keyword),
    );
  }, [bankSearch, banks]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listBackofficePaymentSettings();
      setSettings(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải cấu hình thanh toán.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadData]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setIsLoadingBanks(true);

      fetchVietQrBanks(controller.signal)
        .then((response) => setBanks(response))
        .catch((error) => {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          toast.error(error instanceof Error ? error.message : "Không thể tải danh sách ngân hàng VietQR.");
        })
        .finally(() => setIsLoadingBanks(false));
    }, 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm(DEFAULT_FORM);
  }

  function editSetting(setting: PaymentSetting) {
    setEditingId(setting.id);
    setForm({
      bankCode: setting.bankCode,
      bankName: setting.bankName,
      accountNumber: setting.accountNumber,
      accountName: setting.accountName,
      qrTemplate: setting.qrTemplate,
      transferContentTemplate: setting.transferContentTemplate,
      active: setting.active,
    });
  }

  function selectBank(bank: VietQrBank) {
    setForm((current) => ({
      ...current,
      bankCode: bank.bin,
      bankName: bank.shortName || bank.name,
    }));
    setBankSearch("");
    setIsBankDropdownOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateSettingPayload(form);

    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    const payload = buildPayload(form, Boolean(editingId));

    setIsSubmitting(true);
    const loadingToastId = toast.loading(
      editingId ? "Đang cập nhật cấu hình thanh toán..." : "Đang tạo cấu hình thanh toán...",
    );

    try {
      if (editingId) {
        await updateBackofficePaymentSetting(editingId, payload);
      } else {
        await createBackofficePaymentSetting(payload);
      }

      toast.success(editingId ? "Đã cập nhật cấu hình thanh toán." : "Đã tạo cấu hình thanh toán.", {
        id: loadingToastId,
      });
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình thanh toán.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSetActive(setting: PaymentSetting) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang đặt cấu hình mặc định...");

    try {
      await updateBackofficePaymentSetting(setting.id, {
        bankCode: setting.bankCode,
        bankName: setting.bankName,
        accountNumber: setting.accountNumber,
        accountName: setting.accountName,
        qrTemplate: setting.qrTemplate,
        transferContentTemplate: setting.transferContentTemplate,
        active: true,
      });
      toast.success("Đã đặt cấu hình thanh toán mặc định.", { id: loadingToastId });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đặt cấu hình mặc định.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(setting: PaymentSetting) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang xóa cấu hình thanh toán...");

    try {
      await deleteBackofficePaymentSetting(setting.id);
      toast.success("Đã xóa cấu hình thanh toán.", { id: loadingToastId });

      if (editingId === setting.id) {
        resetForm();
      }

      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa cấu hình thanh toán.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTestQr(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = testAmount.trim();
    const note = testNote.trim();
    const parsedAmount = Number(amount);

    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.warning("Số tiền test phải lớn hơn 0.");
      return;
    }

    if (!note) {
      toast.warning("Vui lòng nhập ghi chú test QR.");
      return;
    }

    setIsTesting(true);
    const loadingToastId = toast.loading("Đang tạo QR thử...");

    try {
      const response = await testBackofficeVietQrPayment({ amount, note });
      setTestResult(response);
      toast.success("Đã tạo QR thử.", { id: loadingToastId });
    } catch (error) {
      setTestResult(null);
      toast.error(error instanceof Error ? error.message : "Không thể tạo QR thử.", {
        id: loadingToastId,
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {surface === "admin" ? "Quản trị" : "Nhân viên"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Cấu hình thanh toán</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quản lý tài khoản nhận tiền VietQR và kiểm tra QR trước khi dùng cho đơn hàng.
          </p>
        </div>

        <Button
          className="h-10 px-3 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => void loadData()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </header>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Đang dùng
          </p>
          <p className="mt-2 text-lg font-black">
            {activeSetting ? activeSetting.bankName : "Chưa có cấu hình active"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeSetting ? activeSetting.accountNumber : "API test QR cần một cấu hình active=true."}
          </p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tổng cấu hình
          </p>
          <p className="mt-2 text-lg font-black">{settings.length}</p>
          <p className="mt-1 text-sm text-muted-foreground">Chỉ một cấu hình được bật tại một thời điểm.</p>
        </div>
        <div className="border border-border bg-background p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Provider
          </p>
          <p className="mt-2 text-lg font-black">VIETQR</p>
          <p className="mt-1 text-sm text-muted-foreground">QR được dựng từ cấu hình active của backend.</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,440px)_minmax(0,1fr)]">
        <div className="space-y-6">
          <form className="space-y-4 border border-border bg-background p-4 md:p-5" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black tracking-tight">
                  {editingId ? "Cập nhật tài khoản" : "Thêm tài khoản thanh toán"}
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nội dung chuyển khoản có thể dùng biến {"{orderCode}"} khi backend tạo QR cho đơn hàng.
                </p>
              </div>

              {editingId ? (
                <Button
                  className="h-8 px-2 text-xs"
                  onClick={resetForm}
                  type="button"
                  variant="outline"
                >
                  <X className="size-3.5" />
                  Hủy sửa
                </Button>
              ) : null}
            </div>

            <div className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Ngân hàng
              </span>
              <div className="relative">
                <button
                  className="flex h-11 w-full cursor-pointer items-center justify-between gap-3 border border-border bg-background px-3 text-left outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoadingBanks}
                  onClick={() => setIsBankDropdownOpen((current) => !current)}
                  type="button"
                >
                  <span className="min-w-0 truncate">
                    {selectedBank
                      ? `${selectedBank.shortName || selectedBank.name} | ${selectedBank.bin}`
                      : form.bankName
                        ? `${form.bankName} | ${form.bankCode}`
                        : isLoadingBanks
                          ? "Đang tải danh sách ngân hàng..."
                          : "Chọn ngân hàng"}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </button>

                {isBankDropdownOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 border border-border bg-background">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                      <Search className="size-4 text-muted-foreground" />
                      <input
                        autoFocus
                        className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none"
                        placeholder="Tìm theo tên, mã hoặc BIN"
                        value={bankSearch}
                        onChange={(event) => setBankSearch(event.target.value)}
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {filteredBanks.length > 0 ? (
                        filteredBanks.map((bank) => (
                          <button
                            className="grid w-full cursor-pointer gap-1 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-muted focus:bg-muted focus:outline-none"
                            key={`${bank.bin}-${bank.code}`}
                            onClick={() => selectBank(bank)}
                            type="button"
                          >
                            <span className="font-semibold">{bank.shortName || bank.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {bank.name} | {bank.code} | BIN {bank.bin}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-sm text-muted-foreground">
                          Không tìm thấy ngân hàng phù hợp.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                FE tự điền mã ngân hàng và tên ngân hàng từ VietQR, admin chỉ cần chọn một dòng.
              </p>
            </div>

            <div className="hidden">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Mã ngân hàng
                </span>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  value={form.bankCode}
                  onChange={(event) => setForm((current) => ({ ...current, bankCode: event.target.value }))}
                  placeholder="970436"
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Tên ngân hàng
                </span>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  value={form.bankName}
                  onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))}
                  placeholder="Vietcombank"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Số tài khoản
              </span>
              <input
                className="h-11 border border-border bg-background px-3 font-mono outline-none focus:border-primary"
                value={form.accountNumber}
                onChange={(event) => setForm((current) => ({ ...current, accountNumber: event.target.value }))}
                placeholder="1234567890"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tên chủ tài khoản
              </span>
              <input
                className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                value={form.accountName}
                onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))}
                placeholder="CONG TY AHSO"
              />
            </label>

            <label className="flex items-center gap-3 border border-border px-3 py-3 text-sm">
              <input
                checked={form.active}
                className="size-4 cursor-pointer accent-primary"
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                type="checkbox"
              />
              <span className="font-semibold">Đặt làm cấu hình đang dùng</span>
            </label>

            <details className="group border border-border">
              <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold transition-colors hover:bg-muted">
                <span>Nâng cao</span>
                <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-4 border-t border-border p-3">
                <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Mẫu QR
                </span>
                <select
                  className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                  value={form.qrTemplate}
                  onChange={(event) => setForm((current) => ({ ...current, qrTemplate: event.target.value }))}
                >
                  <option value="">Mặc định backend (compact2)</option>
                  {QR_TEMPLATE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

                  <label className="hidden">
                <input
                  checked={form.active}
                  className="size-4 cursor-pointer accent-primary"
                  onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                  type="checkbox"
                />
                <span className="font-semibold">Đặt làm cấu hình đang dùng</span>
              </label>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Mẫu nội dung chuyển khoản
              </span>
              <input
                className="h-11 border border-border bg-background px-3 font-mono outline-none focus:border-primary"
                value={form.transferContentTemplate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, transferContentTemplate: event.target.value }))
                }
                placeholder="AHSO {orderCode}"
              />
            </label>

              </div>
            </details>

            <Button className="h-11 w-full text-sm font-semibold" disabled={isSubmitting || isLoading} type="submit">
              <Save className="size-4" />
              {editingId ? "Cập nhật cấu hình" : "Lưu cấu hình"}
            </Button>
          </form>

          <form className="space-y-4 border border-border bg-background p-4 md:p-5" onSubmit={handleTestQr}>
            <div>
              <h2 className="text-base font-black tracking-tight">Test QR</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tạo QR thử bằng cấu hình đang active, không tạo đơn hàng và không lưu giao dịch.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Số tiền
                </span>
                <input
                  className="h-11 border border-border bg-background px-3 font-mono outline-none focus:border-primary"
                  min={1}
                  step={1}
                  type="number"
                  value={testAmount}
                  onChange={(event) => setTestAmount(event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ghi chú
                </span>
                <input
                  className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
                  value={testNote}
                  onChange={(event) => setTestNote(event.target.value)}
                  placeholder="TEST QR AHSO"
                />
              </label>
            </div>

            <Button
              className="h-11 w-full text-sm font-semibold"
              disabled={isTesting || isLoading || !activeSetting}
              type="submit"
              variant="outline"
            >
              <QrCode className="size-4" />
              Tạo QR thử
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <section className="border border-border bg-background">
            <div className="border-b border-border px-4 py-3 md:px-5">
              <h2 className="text-base font-black tracking-tight">Danh sách cấu hình</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Cấu hình active được backend dùng để tạo QR thanh toán cho checkout và đơn hàng.
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3 p-5">
                <div className="h-16 animate-pulse bg-muted" />
                <div className="h-16 animate-pulse bg-muted" />
                <div className="h-16 animate-pulse bg-muted" />
              </div>
            ) : errorMessage ? (
              <div className="p-5 text-sm text-destructive">{errorMessage}</div>
            ) : settings.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                Chưa có cấu hình thanh toán. Hãy thêm tài khoản nhận tiền trước khi test VietQR.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {settings.map((setting) => (
                  <article key={setting.id} className="p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black tracking-tight">{getSettingLabel(setting)}</h3>
                          {setting.active ? (
                            <span className="inline-flex items-center gap-1 border border-green-700 bg-green-50 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-green-700">
                              <BadgeCheck className="size-3" />
                              Đang dùng
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{setting.accountName}</p>
                        <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                          <span>
                            Template QR: <strong className="text-foreground">{setting.qrTemplate}</strong>
                          </span>
                          <span>
                            Cập nhật: <strong className="text-foreground">{formatDate(setting.updatedAt)}</strong>
                          </span>
                          <span className="sm:col-span-2">
                            Nội dung: <strong className="font-mono text-foreground">{setting.transferContentTemplate}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!setting.active ? (
                          <Button
                            className="h-9 px-3 text-xs"
                            disabled={isSubmitting}
                            onClick={() => void handleSetActive(setting)}
                            type="button"
                            variant="outline"
                          >
                            <Star className="size-3.5" />
                            Đặt mặc định
                          </Button>
                        ) : null}
                        <Button
                          className="h-9 px-3 text-xs"
                          disabled={isSubmitting}
                          onClick={() => editSetting(setting)}
                          type="button"
                          variant="outline"
                        >
                          <Pencil className="size-3.5" />
                          Sửa
                        </Button>
                        <Button
                          className="h-9 px-3 text-xs"
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(setting)}
                          type="button"
                          variant="destructive"
                        >
                          <Trash2 className="size-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="border border-border bg-background">
            <div className="border-b border-border px-4 py-3 md:px-5">
              <h2 className="text-base font-black tracking-tight">Kết quả QR thử</h2>
              <p className="mt-1 text-xs text-muted-foreground">Đối chiếu nhanh ngân hàng, tài khoản và nội dung chuyển khoản.</p>
            </div>

            {testResult ? (
              <div className="grid gap-5 p-4 md:grid-cols-[240px_minmax(0,1fr)] md:p-5">
                <div className="border border-border bg-muted/30 p-3">
                  <Image
                    alt="QR thanh toán VietQR thử"
                    className="h-auto w-full"
                    height={240}
                    src={testResult.paymentQrUrl}
                    width={240}
                  />
                </div>
                <dl className="grid gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Ngân hàng
                    </dt>
                    <dd className="mt-1 font-semibold">{testResult.paymentBankName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Số tài khoản
                    </dt>
                    <dd className="mt-1 font-mono font-semibold">{testResult.paymentBankAccountNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Chủ tài khoản
                    </dt>
                    <dd className="mt-1 font-semibold">{testResult.paymentBankAccountName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Nội dung chuyển khoản
                    </dt>
                    <dd className="mt-1 break-words font-mono font-semibold">{testResult.paymentTransferContent}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div className="flex min-h-48 items-center justify-center p-5 text-center text-sm text-muted-foreground">
                <div>
                  <CreditCard className="mx-auto mb-3 size-8" />
                  Chưa có QR thử. Nhập số tiền và ghi chú, sau đó bấm tạo QR thử.
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
