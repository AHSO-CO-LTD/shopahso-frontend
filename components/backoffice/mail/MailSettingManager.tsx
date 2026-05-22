"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { MailCheck, RefreshCw, Save, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getBackofficeMailSettings,
  testBackofficeMailSettings,
  updateBackofficeMailSettings,
} from "@/lib/api/services/mail-settings.service";
import type { MailSettings, MailSettingsPayload } from "@/lib/mail/types";

type MailSettingsForm = {
  adminOrderRecipientsText: string;
  notifyRegistrationCustomer: boolean;
  notifyOrderCreatedCustomer: boolean;
  notifyOrderStatusCustomer: boolean;
  notifyOrderCreatedAdmin: boolean;
  notifyOrderCompletedAdmin: boolean;
};

type ToggleConfig = {
  key: keyof Omit<MailSettingsForm, "adminOrderRecipientsText">;
  title: string;
  description: string;
};

const DEFAULT_FORM: MailSettingsForm = {
  adminOrderRecipientsText: "",
  notifyRegistrationCustomer: true,
  notifyOrderCreatedCustomer: true,
  notifyOrderStatusCustomer: true,
  notifyOrderCreatedAdmin: true,
  notifyOrderCompletedAdmin: true,
};

const TOGGLE_CONFIGS: ToggleConfig[] = [
  {
    key: "notifyRegistrationCustomer",
    title: "Chào mừng khách đăng ký",
    description: "Gửi email cho khách ngay sau khi tạo tài khoản thành công.",
  },
  {
    key: "notifyOrderCreatedCustomer",
    title: "Xác nhận đặt hàng cho khách",
    description: "Gửi email cho khách khi đơn hàng được tạo từ checkout.",
  },
  {
    key: "notifyOrderStatusCustomer",
    title: "Cập nhật trạng thái đơn",
    description: "Gửi email cho khách khi trạng thái đơn hàng thay đổi.",
  },
  {
    key: "notifyOrderCreatedAdmin",
    title: "Báo đơn mới cho admin",
    description: "Gửi email tới danh sách admin khi có đơn hàng mới.",
  },
  {
    key: "notifyOrderCompletedAdmin",
    title: "Báo đơn hoàn thành cho admin",
    description: "Gửi email tới danh sách admin khi đơn hàng hoàn thành.",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

function splitEmailLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((email) => email.trim())
    .filter(Boolean);
}

function hasDuplicateEmails(emails: string[]) {
  return new Set(emails.map((email) => email.toLowerCase())).size !== emails.length;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toForm(settings: MailSettings): MailSettingsForm {
  return {
    adminOrderRecipientsText: settings.adminOrderRecipients.join("\n"),
    notifyRegistrationCustomer: settings.notifyRegistrationCustomer,
    notifyOrderCreatedCustomer: settings.notifyOrderCreatedCustomer,
    notifyOrderStatusCustomer: settings.notifyOrderStatusCustomer,
    notifyOrderCreatedAdmin: settings.notifyOrderCreatedAdmin,
    notifyOrderCompletedAdmin: settings.notifyOrderCompletedAdmin,
  };
}

function buildPayload(form: MailSettingsForm): MailSettingsPayload {
  return {
    adminOrderRecipients: splitEmailLines(form.adminOrderRecipientsText),
    notifyRegistrationCustomer: form.notifyRegistrationCustomer,
    notifyOrderCreatedCustomer: form.notifyOrderCreatedCustomer,
    notifyOrderStatusCustomer: form.notifyOrderStatusCustomer,
    notifyOrderCreatedAdmin: form.notifyOrderCreatedAdmin,
    notifyOrderCompletedAdmin: form.notifyOrderCompletedAdmin,
  };
}

function validateEmails(emails: string[], emptyMessage: string) {
  if (emails.length === 0) {
    return emptyMessage;
  }

  const invalidEmail = emails.find((email) => !isValidEmail(email));

  if (invalidEmail) {
    return `Email không hợp lệ: ${invalidEmail}`;
  }

  if (hasDuplicateEmails(emails)) {
    return "Danh sách email admin đang bị trùng.";
  }

  return null;
}

function StatusBlock({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-black">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  disabled,
  onChange,
  title,
}: {
  checked: boolean;
  description: string;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  title: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border border-border bg-background p-4 transition-colors hover:bg-muted/40">
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center border border-border bg-muted transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary">
        <input
          checked={checked}
          className="peer sr-only"
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="ml-0.5 size-5 bg-background transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function MailSettingManager() {
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [form, setForm] = useState<MailSettingsForm>(DEFAULT_FORM);
  const [testEmail, setTestEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const adminEmails = useMemo(() => splitEmailLines(form.adminOrderRecipientsText), [form.adminOrderRecipientsText]);
  const enabledNotificationCount = useMemo(
    () =>
      TOGGLE_CONFIGS.filter((config) => Boolean(form[config.key])).length,
    [form],
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getBackofficeMailSettings();
      setSettings(response);
      setForm(toForm(response));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải cấu hình email.";
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

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateEmails(adminEmails, "Vui lòng nhập ít nhất một email admin nhận thông báo.");

    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setIsSaving(true);
    const loadingToastId = toast.loading("Đang lưu cấu hình email...");

    try {
      const response = await updateBackofficeMailSettings(buildPayload(form));
      setSettings(response);
      setForm(toForm(response));
      toast.success("Đã lưu cấu hình email.", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình email.", {
        id: loadingToastId,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = testEmail.trim();
    const validationMessage = validateEmails([email].filter(Boolean), "Vui lòng nhập email nhận thư thử.");

    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setIsTesting(true);
    const loadingToastId = toast.loading("Đang gửi email thử...");

    try {
      const response = await testBackofficeMailSettings({ email });

      if (!response.sent) {
        throw new Error("Backend chưa xác nhận email đã được gửi.");
      }

      toast.success("Đã gửi email thử.", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi email thử.", {
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
            Quản trị
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Cấu hình email</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Quản lý danh sách admin nhận thông báo đơn hàng và bật tắt các email tự động từ backend.
          </p>
        </div>

        <Button
          className="h-10 cursor-pointer px-3 text-sm font-semibold"
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
        {isLoading ? (
          <>
            <Skeleton className="h-28 border border-border" />
            <Skeleton className="h-28 border border-border" />
            <Skeleton className="h-28 border border-border" />
          </>
        ) : (
          <>
            <StatusBlock
              description="Địa chỉ nhận email khi có đơn mới hoặc đơn hoàn thành."
              label="Email admin"
              value={`${adminEmails.length}`}
            />
            <StatusBlock
              description="Tổng số loại email tự động đang được backend gửi."
              label="Thông báo bật"
              value={`${enabledNotificationCount}/${TOGGLE_CONFIGS.length}`}
            />
            <StatusBlock
              description={settings ? `Cập nhật lần cuối: ${formatDate(settings.updatedAt)}` : "Chưa tải được cấu hình."}
              label="Trạng thái"
              value={settings ? "Đã kết nối" : "Chưa có dữ liệu"}
            />
          </>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <form className="space-y-6 border border-border bg-background p-4 md:p-5" onSubmit={handleSave}>
          <div>
            <h2 className="text-base font-black tracking-tight">Thiết lập gửi mail</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Mỗi email admin đặt trên một dòng hoặc phân tách bằng dấu phẩy.
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-36 border border-border" />
              <Skeleton className="h-20 border border-border" />
              <Skeleton className="h-20 border border-border" />
              <Skeleton className="h-20 border border-border" />
            </div>
          ) : errorMessage ? (
            <div className="border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : (
            <>
              <label className="grid gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Email admin nhận thông báo đơn hàng
                </span>
                <textarea
                  className="min-h-36 resize-y border border-border bg-background px-3 py-3 font-mono text-sm outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, adminOrderRecipientsText: event.target.value }))
                  }
                  placeholder="admin1@gmail.com&#10;admin2@gmail.com"
                  value={form.adminOrderRecipientsText}
                />
              </label>

              <div className="grid gap-3">
                {TOGGLE_CONFIGS.map((config) => (
                  <ToggleRow
                    checked={Boolean(form[config.key])}
                    description={config.description}
                    disabled={isSaving}
                    key={config.key}
                    onChange={(checked) => setForm((current) => ({ ...current, [config.key]: checked }))}
                    title={config.title}
                  />
                ))}
              </div>

              <Button className="h-11 w-full cursor-pointer text-sm font-semibold" disabled={isSaving} type="submit">
                <Save className="size-4" />
                Lưu cấu hình
              </Button>
            </>
          )}
        </form>

        <aside className="space-y-6">
          <form className="space-y-4 border border-border bg-background p-4 md:p-5" onSubmit={handleTestEmail}>
            <div>
              <h2 className="text-base font-black tracking-tight">Gửi email thử</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Dùng để kiểm tra SMTP sau khi backend đã được cấu hình.
              </p>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Email nhận thư thử
              </span>
              <input
                className="h-11 border border-border bg-background px-3 font-mono outline-none transition-colors hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isTesting}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder="admin@gmail.com"
                type="email"
                value={testEmail}
              />
            </label>

            <Button
              className="h-11 w-full cursor-pointer text-sm font-semibold"
              disabled={isTesting || isLoading}
              type="submit"
              variant="outline"
            >
              <Send className="size-4" />
              Gửi email thử
            </Button>
          </form>

          <section className="border border-border bg-background p-4 md:p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-base font-black tracking-tight">Mail tự động</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Frontend chỉ quản lý cấu hình. Email đăng ký, đặt hàng, đổi trạng thái và thông báo đơn hàng được
                  backend gửi tự động theo các công tắc bên trái.
                </p>
              </div>
            </div>
          </section>

          <section className="border border-border bg-background p-4 md:p-5">
            <div className="flex items-center gap-3">
              <MailCheck className="size-5 text-primary" />
              <div>
                <p className="text-sm font-bold">Danh sách hiện tại</p>
                <p className="text-xs text-muted-foreground">{adminEmails.length} email admin</p>
              </div>
            </div>

            {adminEmails.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {adminEmails.map((email) => (
                  <span
                    className="border border-border bg-muted/40 px-2.5 py-1 font-mono text-xs text-foreground"
                    key={email}
                  >
                    {email}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Chưa có email admin nào trong form.</p>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}
