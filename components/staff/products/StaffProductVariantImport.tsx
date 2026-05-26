"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import StaffLayout from "@/components/staff/StaffLayout";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { getBackofficeProduct } from "@/lib/api/services/products.service";
import {
  commitBackofficeVariantImport,
  downloadBackofficeVariantImportTemplate,
  previewBackofficeVariantImport,
  type VariantImportCommitResponse,
  type VariantImportPreviewError,
  type VariantImportPreviewResponse,
} from "@/lib/api/services/variants.service";
import { getPricingStatusBadgeClass, getPricingStatusLabel } from "@/lib/pricing-status";
import type { ProductDetail } from "@/lib/product/types";

type ImportValidationPayload = {
  message?: string;
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
  errors?: VariantImportPreviewError[];
};

function parseImportValidationPayload(error: unknown): ImportValidationPayload | null {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const source = error.details || error.message;
  if (!source) {
    return null;
  }

  try {
    const parsed = JSON.parse(source) as ImportValidationPayload;
    return parsed;
  } catch {
    return null;
  }
}

function toPreviewFallback(productId: string, message: string, parsed: ImportValidationPayload | null): VariantImportPreviewResponse {
  return {
    productId,
    headers: [],
    attributeColumns: [],
    totalRows: parsed?.totalRows ?? 0,
    validRows: parsed?.validRows ?? 0,
    invalidRows: parsed?.invalidRows ?? 0,
    errors:
      parsed?.errors && parsed.errors.length > 0
        ? parsed.errors
        : [{ rowNumber: 0, field: "file", message }],
    rows: [],
  };
}

export default function StaffProductVariantImport({ productId }: { productId: string }) {
  const router = useRouter();
  const previewSectionRef = useRef<HTMLElement | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [previewData, setPreviewData] = useState<VariantImportPreviewResponse | null>(null);
  const [commitData, setCommitData] = useState<VariantImportCommitResponse | null>(null);

  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const loadProductDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getBackofficeProduct(productId);
      setProductDetail(response);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tải thông tin sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProductDetail();
  }, [loadProductDetail]);

  useEffect(() => {
    if (!previewData) {
      return;
    }
    previewSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [previewData]);

  const previewSummary = useMemo(() => {
    if (!previewData) {
      return null;
    }

    return [
      { label: "Tổng số dòng", value: previewData.totalRows },
      { label: "Dòng hợp lệ", value: previewData.validRows },
      { label: "Dòng lỗi", value: previewData.invalidRows },
      { label: "Cột thông số", value: previewData.attributeColumns.length },
    ];
  }, [previewData]);

  const canCommit = Boolean(previewData && previewData.invalidRows === 0 && previewData.validRows > 0 && selectedFile);

  const handlePreview = useCallback(async (fileOverride?: File) => {
    const fileToPreview = fileOverride ?? selectedFile;
    if (!fileToPreview) {
      toast.warning("Vui lòng chọn file CSV trước khi xem trước.");
      return;
    }

    setIsPreviewing(true);
    setCommitData(null);
    const loadingId = toast.loading("Đang phân tích file CSV...");
    try {
      const response = await previewBackofficeVariantImport(productId, fileToPreview);
      setPreviewData(response);

      if (response.invalidRows > 0) {
        toast.warning(`Preview hoàn tất: ${response.invalidRows} dòng lỗi cần chỉnh sửa.`, { id: loadingId });
      } else {
        toast.success(`Preview hợp lệ: ${response.validRows} dòng sẵn sàng import.`, { id: loadingId });
      }
    } catch (error) {
      const parsed = parseImportValidationPayload(error);
      const message = parsed?.message || (error instanceof Error ? error.message : "Không thể preview file CSV.");
      setPreviewData(toPreviewFallback(productId, message, parsed));
      toast.error(message, { id: loadingId });
    } finally {
      setIsPreviewing(false);
    }
  }, [productId, selectedFile]);

  const handleSelectFile = async (file: File | null) => {
    setSelectedFile(file);
    setPreviewData(null);
    setCommitData(null);
    setCsvText("");
    setCsvFileName("");

    if (!file) {
      return;
    }

    setIsPreparingFile(true);
    try {
      const text = await file.text();
      const normalizedFile = new File([text], file.name, { type: file.type || "text/csv" });
      setCsvText(text);
      setCsvFileName(file.name);
      setSelectedFile(normalizedFile);
      toast.success("Tải file thành công. Đang chuyển sang bước preview.");
      await handlePreview(normalizedFile);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đọc file CSV.");
    } finally {
      setIsPreparingFile(false);
    }
  };

  const handleRecheckFromEditor = async () => {
    if (!csvText.trim()) {
      toast.warning("Nội dung CSV đang trống, vui lòng kiểm tra lại.");
      return;
    }

    const fileName = csvFileName || `variant-import-${productId}.csv`;
    const editedFile = new File([csvText], fileName, { type: "text/csv" });
    setSelectedFile(editedFile);
    await handlePreview(editedFile);
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    const loadingId = toast.loading("Đang tải file mẫu CSV...");
    try {
      const blob = await downloadBackofficeVariantImportTemplate(productId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `variant-import-template-${productId}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      toast.success("Đã tải file mẫu CSV.", { id: loadingId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải file mẫu CSV.", { id: loadingId });
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleCommit = async () => {
    if (!selectedFile) {
      toast.warning("Vui lòng chọn file CSV để import.");
      return;
    }

    if (!previewData) {
      toast.warning("Vui lòng preview trước khi import.");
      return;
    }

    setIsCommitting(true);
    const loadingId = toast.loading("Đang import biến thể từ CSV...");
    try {
      const response = await commitBackofficeVariantImport(productId, selectedFile);
      setCommitData(response);
      toast.success(`Import thành công ${response.createdCount} biến thể.`, { id: loadingId });
      router.replace(`/nhan-vien/san-pham/${productId}/bien-the`);
      router.refresh();
    } catch (error) {
      const parsed = parseImportValidationPayload(error);
      toast.error(parsed?.message || (error instanceof Error ? error.message : "Import CSV thất bại."), {
        id: loadingId,
      });

      if (parsed?.errors?.length) {
        setPreviewData((current) => {
          if (!current) {
            return null;
          }
          return {
            ...current,
            totalRows: parsed.totalRows ?? current.totalRows,
            validRows: parsed.validRows ?? current.validRows,
            invalidRows: parsed.invalidRows ?? current.invalidRows,
            errors: parsed.errors ?? current.errors,
          };
        });
      }
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <StaffLayout>
      <div className="flex h-full min-h-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <section className="flex h-full min-h-0 w-full flex-col border border-border bg-background">
          <header className="border-b border-border px-6 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Import biến thể CSV</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              {productDetail ? `Import biến thể - ${productDetail.name}` : "Import biến thể"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild className="h-9 px-3 text-xs font-semibold" variant="outline">
                <Link href={`/nhan-vien/san-pham/${productId}/bien-the`}>Quay lại danh sách biến thể</Link>
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="px-6 py-8 text-sm text-muted-foreground">Đang tải dữ liệu import...</div>
          ) : errorMessage ? (
            <div className="space-y-4 px-6 py-8">
              <p className="text-sm text-destructive">{errorMessage}</p>
              <Button className="h-10 px-4 text-sm font-semibold" onClick={() => void loadProductDetail()} type="button" variant="outline">
                Tải lại
              </Button>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
              <article className="space-y-4 border border-border p-4 md:p-5">
                <h3 className="text-base font-black tracking-tight">Bước 1: Chuẩn bị file CSV</h3>
                <p className="text-sm text-muted-foreground">
                  Tải file mẫu theo đúng sản phẩm, điền dữ liệu biến thể, sau đó upload để xem trước trước khi import.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    className="h-10 cursor-pointer px-4 text-sm font-semibold"
                    disabled={isDownloadingTemplate}
                    onClick={() => void handleDownloadTemplate()}
                    type="button"
                    variant="outline"
                  >
                    {isDownloadingTemplate ? "Đang tải mẫu..." : "Tải file mẫu CSV"}
                  </Button>

                  <label className="inline-flex h-10 cursor-pointer items-center border border-border px-4 text-sm font-semibold">
                    Chọn file CSV
                    <input
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) => handleSelectFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </label>

                  <Button
                    className="h-10 cursor-pointer px-4 text-sm font-semibold"
                    disabled={!selectedFile || isPreviewing || isPreparingFile}
                    onClick={() => void handleRecheckFromEditor()}
                    type="button"
                  >
                    {isPreviewing ? "Đang kiểm lỗi..." : "Kiểm lỗi lại"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  File đã chọn: {selectedFile ? `${selectedFile.name} (${Math.ceil(selectedFile.size / 1024)} KB)` : "Chưa chọn file"}
                </p>

                {selectedFile ? (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Chỉnh sửa trực tiếp nội dung CSV</label>
                    <textarea
                      className="min-h-56 w-full border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
                      onChange={(event) => setCsvText(event.target.value)}
                      value={csvText}
                    />
                    <p className="text-xs text-muted-foreground">
                      Sau khi sửa nội dung, bấm <span className="font-semibold">Kiểm lỗi lại</span> để validate lại ngay trên trang preview.
                    </p>
                  </div>
                ) : null}
              </article>

              {previewData ? (
                <article ref={previewSectionRef} className="mt-5 space-y-4 border border-border p-4 md:p-5">
                  <h3 className="text-base font-black tracking-tight">Bước 2: Preview trước khi import</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {previewSummary?.map((item) => (
                      <div key={item.label} className="border border-border px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
                        <p className="mt-2 text-lg font-black">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {previewData.errors.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-destructive">Danh sách lỗi cần sửa trong CSV</p>
                      <div className="overflow-x-auto border border-border">
                        <table className="min-w-full border-collapse text-sm">
                          <thead className="bg-muted/20 text-left">
                            <tr>
                              <th className="border-b border-border px-3 py-2">Dòng</th>
                              <th className="border-b border-border px-3 py-2">Trường</th>
                              <th className="border-b border-border px-3 py-2">Lỗi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.errors.map((errorItem, index) => (
                              <tr key={`${errorItem.rowNumber}-${errorItem.field}-${index}`}>
                                <td className="border-b border-border px-3 py-2">{errorItem.rowNumber}</td>
                                <td className="border-b border-border px-3 py-2">{errorItem.field}</td>
                                <td className="border-b border-border px-3 py-2">{errorItem.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-600">Không có lỗi validate. Có thể import ngay.</p>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Dữ liệu hợp lệ (preview)</p>
                    {previewData.rows.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Chưa có dòng hợp lệ để hiển thị.</p>
                    ) : (
                      <div className="overflow-x-auto border border-border">
                        <table className="min-w-full border-collapse text-sm">
                          <thead className="bg-muted/20 text-left">
                            <tr>
                              <th className="border-b border-border px-3 py-2">Dòng</th>
                              <th className="border-b border-border px-3 py-2">Tên biến thể</th>
                              <th className="border-b border-border px-3 py-2">SKU</th>
                              <th className="border-b border-border px-3 py-2">Slug</th>
                              <th className="border-b border-border px-3 py-2">Xuất xứ</th>
                              <th className="border-b border-border px-3 py-2">Giá bán</th>
                              <th className="border-b border-border px-3 py-2">Trạng thái giá</th>
                              <th className="border-b border-border px-3 py-2">Giá nhập</th>
                              <th className="border-b border-border px-3 py-2">Tồn kho</th>
                              <th className="border-b border-border px-3 py-2">Đơn vị</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.rows.map((row) => (
                              <tr key={`${row.rowNumber}-${row.sku}`}>
                                <td className="border-b border-border px-3 py-2">{row.rowNumber}</td>
                                <td className="border-b border-border px-3 py-2">{row.variantName}</td>
                                <td className="border-b border-border px-3 py-2">{row.sku}</td>
                                <td className="border-b border-border px-3 py-2">{row.slug}</td>
                                <td className="border-b border-border px-3 py-2">
                                  {row.originCountryName ? `${row.originCountryName} (${row.originCountryCode})` : row.originCountryCode ?? "-"}
                                </td>
                                <td className="border-b border-border px-3 py-2">{row.price}</td>
                                <td className="border-b border-border px-3 py-2">
                                  <span className={`inline-flex border px-2 py-1 text-[11px] font-semibold ${getPricingStatusBadgeClass(row.pricingStatus)}`}>
                                    {getPricingStatusLabel(row.pricingStatus)}
                                  </span>
                                </td>
                                <td className="border-b border-border px-3 py-2">{row.costPrice}</td>
                                <td className="border-b border-border px-3 py-2">{row.stockQuantity}</td>
                                <td className="border-b border-border px-3 py-2">{row.unit}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="h-10 cursor-pointer px-4 text-sm font-semibold"
                      disabled={!canCommit || isCommitting}
                      onClick={() => void handleCommit()}
                      type="button"
                    >
                      {isCommitting ? "Đang import..." : "Xác nhận import"}
                    </Button>
                  </div>
                </article>
              ) : null}

              {commitData ? (
                <article className="mt-5 space-y-3 border border-border p-4 md:p-5">
                  <h3 className="text-base font-black tracking-tight">Kết quả import</h3>
                  <p className="text-sm text-muted-foreground">
                    Đã tạo {commitData.createdCount}/{commitData.totalRows} biến thể thành công.
                  </p>

                  {commitData.createdVariants.length > 0 ? (
                    <div className="overflow-x-auto border border-border">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-muted/20 text-left">
                          <tr>
                            <th className="border-b border-border px-3 py-2">Tên biến thể</th>
                            <th className="border-b border-border px-3 py-2">SKU</th>
                            <th className="border-b border-border px-3 py-2">Slug</th>
                            <th className="border-b border-border px-3 py-2">Trạng thái giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commitData.createdVariants.map((item) => (
                            <tr key={item.id}>
                              <td className="border-b border-border px-3 py-2">{item.name}</td>
                              <td className="border-b border-border px-3 py-2">{item.sku}</td>
                              <td className="border-b border-border px-3 py-2">{item.slug}</td>
                              <td className="border-b border-border px-3 py-2">
                                <span className={`inline-flex border px-2 py-1 text-[11px] font-semibold ${getPricingStatusBadgeClass(item.pricingStatus)}`}>
                                  {getPricingStatusLabel(item.pricingStatus)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </article>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </StaffLayout>
  );
}
