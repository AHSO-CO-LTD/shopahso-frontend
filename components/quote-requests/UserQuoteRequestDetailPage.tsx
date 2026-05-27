"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  formatQuoteRequestDate,
  getQuoteRequestProductName,
  getQuoteRequestSku,
  getQuoteRequestStatusClass,
  getQuoteRequestStatusLabel,
  getQuoteRequestVariantName,
} from "@/components/quote-requests/quote-request-display";
import { getMyQuoteRequest } from "@/lib/api/services/quote-requests.service";
import type { QuoteRequest } from "@/lib/quote-request/types";

export default function UserQuoteRequestDetailPage({ requestId }: { requestId: string }) {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();
  const [request, setRequest] = useState<QuoteRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequest = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await getMyQuoteRequest(requestId);
      setRequest(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải chi tiết yêu cầu báo giá.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

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
      void loadRequest();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRequest, profile?.id]);

  if (isInitializing || !profile) {
    return (
      <main className="border-t border-border bg-background">
        <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
          <DetailSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Button asChild className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold" variant="outline">
            <Link href="/tai-khoan/yeu-cau-bao-gia">
              <ArrowLeft className="size-4" />
              Danh sách báo giá
            </Link>
          </Button>
          <Button
            className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold"
            disabled={isLoading}
            onClick={() => void loadRequest()}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>

        {isLoading ? (
          <DetailSkeleton />
        ) : errorMessage ? (
          <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">
            <p className="flex items-center gap-2 font-semibold">
              <AlertCircle className="size-4" />
              {errorMessage}
            </p>
          </div>
        ) : !request ? (
          <div className="border border-border p-5 text-sm text-muted-foreground">Không tìm thấy yêu cầu báo giá.</div>
        ) : (
          <article className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border border-border bg-background">
              <div className="border-b border-border px-4 py-4 sm:px-5">
                <p className="font-mono text-sm font-black text-primary">{request.requestCode}</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{getQuoteRequestVariantName(request)}</h1>
                <p className="mt-2 text-sm text-muted-foreground">{getQuoteRequestProductName(request)} | SKU {getQuoteRequestSku(request)}</p>
              </div>

              <div className="grid gap-4 p-4 sm:p-5">
                <InfoBlock title="Thông tin yêu cầu">
                  <InfoLine label="Mã nhóm" value={request.requestGroupCode} mono />
                  <InfoLine label="Số lượng" value={String(request.quantity)} />
                  <InfoLine label="Ngày tạo" value={formatQuoteRequestDate(request.createdAt)} />
                  <InfoLine label="Cập nhật" value={formatQuoteRequestDate(request.updatedAt)} />
                </InfoBlock>

                <InfoBlock title="Ghi chú của bạn">
                  <p className="min-h-20 border border-border bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
                    {request.customerNote || "Bạn chưa nhập ghi chú cho yêu cầu này."}
                  </p>
                </InfoBlock>

                <InfoBlock title="Ghi chú nhân viên">
                  <p className="min-h-20 border border-border bg-muted/10 p-3 text-sm leading-6 text-muted-foreground">
                    {request.staffNote || "Chưa có ghi chú từ nhân viên."}
                  </p>
                </InfoBlock>
              </div>
            </section>

            <aside className="h-fit border border-border bg-muted/10 p-4 sm:p-5 lg:sticky lg:top-24">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Trạng thái</p>
              <span className={`mt-3 inline-flex border px-3 py-2 text-sm font-semibold ${getQuoteRequestStatusClass(request.status)}`}>
                {getQuoteRequestStatusLabel(request.status)}
              </span>
              <dl className="mt-5 grid gap-2 text-sm">
                <InfoLine label="Khách hàng" value={request.customerName} />
                <InfoLine label="Email" value={request.customerEmail} />
                <InfoLine label="Điện thoại" value={request.customerPhone} />
                <InfoLine label="Nhân viên" value={request.claimedByStaff?.fullName || request.claimedByStaff?.email || "Chưa nhận xử lý"} />
              </dl>
            </aside>
          </article>
        )}
      </section>
    </main>
  );
}

function InfoBlock({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-black tracking-tight">{title}</h2>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function InfoLine({ label, mono = false, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="grid gap-1 border border-border bg-background px-3 py-2 text-sm sm:grid-cols-[130px_minmax(0,1fr)] sm:gap-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
      <dd className={`${mono ? "font-mono" : ""} min-w-0 break-words font-semibold`}>{value}</dd>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="border border-border p-4 sm:p-5">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-8 w-3/5" />
        <Skeleton className="mt-2 h-4 w-2/5" />
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-12 w-full" key={index} />
          ))}
        </div>
      </div>
      <div className="border border-border p-4 sm:p-5">
        <FileText className="size-6 text-muted-foreground" />
        <Skeleton className="mt-4 h-8 w-32" />
        <Skeleton className="mt-4 h-12 w-full" />
      </div>
    </div>
  );
}
