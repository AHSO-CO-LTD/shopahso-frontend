"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Percent, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listBackofficeCategories } from "@/lib/api/services/categories.service";
import { listBackofficeProducts } from "@/lib/api/services/products.service";
import {
  deleteBackofficeTaxSetting,
  listBackofficeTaxSettings,
  upsertBackofficeTaxSetting,
} from "@/lib/api/services/tax-settings.service";
import { listBackofficeVariants } from "@/lib/api/services/variants.service";
import type { BackofficeCategory } from "@/lib/category/types";
import type { ProductSummary, VariantSummary } from "@/lib/product/types";
import type { TaxScope, TaxSetting } from "@/lib/tax/types";

const TAX_SCOPE_OPTIONS: Array<{ label: string; value: TaxScope }> = [
  { label: "Toàn bộ cửa hàng", value: "GLOBAL" },
  { label: "Danh mục", value: "CATEGORY" },
  { label: "Sản phẩm", value: "PRODUCT" },
  { label: "Biến thể", value: "VARIANT" },
];

function formatScopeLabel(scope: TaxScope) {
  return TAX_SCOPE_OPTIONS.find((item) => item.value === scope)?.label ?? scope;
}

function parseTaxPercent(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}

function sortByName<TItem extends { name: string }>(items: TItem[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function TaxSettingManager({ surface }: { surface: "admin" | "staff" }) {
  const [settings, setSettings] = useState<TaxSetting[]>([]);
  const [categories, setCategories] = useState<BackofficeCategory[]>([]);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [variants, setVariants] = useState<VariantSummary[]>([]);
  const [scope, setScope] = useState<TaxScope>("GLOBAL");
  const [targetId, setTargetId] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetOptions = useMemo(() => {
    if (scope === "CATEGORY") {
      return sortByName(categories).map((category) => ({
        id: category.id,
        label: category.name,
        meta: category.slug,
      }));
    }

    if (scope === "PRODUCT") {
      return sortByName(products).map((product) => ({
        id: product.id,
        label: product.name,
        meta: product.slug,
      }));
    }

    if (scope === "VARIANT") {
      return sortByName(variants).map((variant) => ({
        id: variant.id,
        label: variant.name,
        meta: `${variant.sku} | ${variant.product.name}`,
      }));
    }

    return [];
  }, [categories, products, scope, variants]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [settingsResponse, categoriesResponse, productsResponse, variantsResponse] = await Promise.all([
        listBackofficeTaxSettings(),
        listBackofficeCategories(),
        listBackofficeProducts(),
        listBackofficeVariants(),
      ]);

      setSettings(settingsResponse);
      setCategories(categoriesResponse);
      setProducts(productsResponse);
      setVariants(variantsResponse);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải dữ liệu thiết lập thuế.";
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTaxPercent = parseTaxPercent(taxPercent);
    if (parsedTaxPercent === null) {
      toast.warning("Thuế phải là số trong khoảng 0 đến 100.");
      return;
    }

    if (scope !== "GLOBAL" && !targetId) {
      toast.warning("Vui lòng chọn đối tượng áp dụng thuế.");
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang lưu thiết lập thuế...");

    try {
      await upsertBackofficeTaxSetting({
        scope,
        targetId: scope === "GLOBAL" ? null : targetId,
        taxPercent: parsedTaxPercent,
      });
      toast.success("Đã lưu thiết lập thuế.", { id: loadingToastId });
      setTaxPercent("");
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu thiết lập thuế.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(setting: TaxSetting) {
    setIsSubmitting(true);
    const loadingToastId = toast.loading("Đang xóa thiết lập thuế...");

    try {
      await deleteBackofficeTaxSetting({
        scope: setting.scope,
        targetId: setting.scope === "GLOBAL" ? null : setting.targetId,
      });
      toast.success("Đã xóa thiết lập thuế.", { id: loadingToastId });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xóa thiết lập thuế.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {surface === "admin" ? "Quản trị" : "Nhân viên"}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Thiết lập thuế</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Áp dụng theo thứ tự ưu tiên: biến thể, sản phẩm, danh mục, toàn shop.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 border border-border px-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          onClick={() => void loadData()}
        >
          <RefreshCw className="size-4" />
          Tải lại
        </button>
      </header>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <form className="h-fit space-y-4 border border-border bg-background p-4 md:p-5" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-base font-black tracking-tight">Tạo hoặc cập nhật rule</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Nếu rule cùng phạm vi đã tồn tại, backend sẽ cập nhật phần trăm thuế.
            </p>
          </div>

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Áp dụng thuế cho
            </span>
            <select
              className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
              value={scope}
              onChange={(event) => {
                setScope(event.target.value as TaxScope);
                setTargetId("");
              }}
            >
              {TAX_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {scope !== "GLOBAL" ? (
            <label className="grid gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Đối tượng áp dụng
              </span>
              <select
                className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary"
                value={targetId}
                onChange={(event) => setTargetId(event.target.value)}
              >
                <option value="">Chọn {formatScopeLabel(scope).toLowerCase()}</option>
                {targetOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label} | {option.meta}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="grid gap-2 text-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Thuế (%)</span>
            <input
              className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
              min={0}
              max={100}
              step="0.01"
              type="number"
              value={taxPercent}
              onChange={(event) => setTaxPercent(event.target.value)}
              placeholder="VD: 10"
            />
          </label>

          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center gap-2 border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSubmitting || isLoading}
          >
            <Percent className="size-4" />
            Lưu thiết lập thuế
          </button>
        </form>

        <section className="border border-border bg-background">
          <div className="border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Rule thuế hiện tại</h2>
            <p className="mt-1 text-xs text-muted-foreground">Danh sách này phản ánh rule backend đang dùng để tính cart.</p>
          </div>

          {isLoading ? (
            <div className="p-5 text-sm text-muted-foreground">Đang tải thiết lập thuế...</div>
          ) : errorMessage ? (
            <div className="p-5 text-sm text-destructive">{errorMessage}</div>
          ) : settings.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              Chưa có rule thuế. Backend sẽ áp dụng 0% cho đến khi có rule phù hợp.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <th className="border-b border-border px-4 py-3 text-left">Phạm vi</th>
                    <th className="border-b border-border px-4 py-3 text-left">Đối tượng</th>
                    <th className="border-b border-border px-4 py-3 text-left">Thuế</th>
                    <th className="border-b border-border px-4 py-3 text-left">Cập nhật</th>
                    <th className="w-20 border-b border-border px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.map((setting) => (
                    <tr key={setting.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{formatScopeLabel(setting.scope)}</td>
                      <td className="px-4 py-3">
                        {setting.scope === "GLOBAL" ? (
                          <span className="text-muted-foreground">Toàn bộ cửa hàng</span>
                        ) : (
                          <div>
                            <p className="font-semibold">{setting.target?.name ?? setting.targetId}</p>
                            <p className="text-xs text-muted-foreground">{setting.target?.slug ?? "Không có slug"}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-black text-primary">{setting.taxPercent}%</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(setting.updatedAt).toLocaleString("vi-VN")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="inline-flex size-9 items-center justify-center border border-border text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSubmitting}
                          onClick={() => void handleDelete(setting)}
                          aria-label={`Xóa rule thuế ${formatScopeLabel(setting.scope)}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
