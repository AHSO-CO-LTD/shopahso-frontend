"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, FileText, Filter, PackageSearch, RefreshCw } from "lucide-react";
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
  QUOTE_REQUEST_STATUSES,
} from "@/components/quote-requests/quote-request-display";
import { listMyQuoteRequests } from "@/lib/api/services/quote-requests.service";
import type { QuoteRequest, QuoteRequestStatus } from "@/lib/quote-request/types";

const statusFilters: Array<{ label: string; value: QuoteRequestStatus | "ALL" }> = [
  { label: "Tất cả", value: "ALL" },
  ...QUOTE_REQUEST_STATUSES.map((status) => ({
    label: getQuoteRequestStatusLabel(status),
    value: status,
  })),
];

export default function UserQuoteRequestsPage() {
  const router = useRouter();
  const { isInitializing, profile } = useAuth();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [activeStatus, setActiveStatus] = useState<QuoteRequestStatus | "ALL">("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listMyQuoteRequests(activeStatus === "ALL" ? {} : { status: activeStatus });
      setRequests(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách yêu cầu báo giá.";
      setErrorMessage(message);
      setRequests([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeStatus]);

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
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRequests, profile?.id]);

  const metrics = useMemo(() => ({
    pending: requests.filter((request) => request.status === "PENDING").length,
    quoted: requests.filter((request) => request.status === "QUOTED").length,
    total: requests.length,
  }), [requests]);

  const activeStatusLabel = statusFilters.find((filter) => filter.value === activeStatus)?.label ?? "Tất cả";

  if (isInitializing || !profile) {
    return (
      <main className="border-t border-border bg-background">
        <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
          <QuoteRequestListSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="border-t border-border bg-background">
      <section className="container mx-auto px-3 py-6 sm:px-4 sm:py-10 lg:py-12">
        <header className="mb-5 flex items-end justify-between gap-3 sm:mb-8 sm:flex-wrap sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Tài khoản người dùng
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">Yêu cầu báo giá của tôi</h1>
            <p className="mt-2 hidden text-sm text-muted-foreground sm:block">
              Theo dõi sản phẩm cần báo giá, trạng thái xử lý và ghi chú phản hồi từ nhân viên.
            </p>
          </div>
          <Button
            className="h-9 shrink-0 cursor-pointer rounded-none px-3 text-xs font-semibold sm:h-10 sm:px-4 sm:text-sm"
            disabled={isLoading}
            onClick={() => void loadRequests()}
            type="button"
            variant="outline"
          >
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">Làm mới</span>
          </Button>
        </header>

        <section className="mb-4 grid grid-cols-3 gap-2 sm:mb-6 sm:gap-3">
          <Metric label="Tổng yêu cầu" value={String(metrics.total)} />
          <Metric label="Đang chờ" value={String(metrics.pending)} />
          <Metric label="Đã nhận xử lý" value={String(metrics.quoted)} />
        </section>

        <section className="mb-4 sm:mb-6">
          <Button
            aria-expanded={isFilterOpen}
            className="h-10 w-full cursor-pointer justify-between rounded-none px-3 text-xs font-semibold sm:hidden"
            onClick={() => setIsFilterOpen((current) => !current)}
            type="button"
            variant="outline"
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Filter className="size-4 shrink-0" />
              <span className="truncate">Lọc: {activeStatusLabel}</span>
            </span>
            <span className="font-mono text-[11px]">{isFilterOpen ? "Ẩn" : "Mở"}</span>
          </Button>
          <div className={`${isFilterOpen ? "grid" : "hidden"} mt-2 grid-cols-2 gap-2 sm:mt-0 sm:flex sm:flex-wrap`}>
            {statusFilters.map((filter) => (
              <button
                className={[
                  "inline-flex h-9 cursor-pointer items-center justify-center border px-2 text-center text-[11px] font-semibold transition-colors hover:border-primary hover:text-primary sm:px-3 sm:text-xs",
                  activeStatus === filter.value ? "border-primary bg-primary text-primary-foreground hover:text-primary-foreground" : "border-border bg-background",
                ].join(" ")}
                key={filter.value}
                onClick={() => {
                  setActiveStatus(filter.value);
                  setIsFilterOpen(false);
                }}
                type="button"
              >
                <span className="truncate">{filter.label}</span>
              </button>
            ))}
          </div>
        </section>

        {isLoading ? (
          <QuoteRequestListSkeleton />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={() => void loadRequests()} />
        ) : requests.length === 0 ? (
          <EmptyState />
        ) : (
          <section className="overflow-x-auto border border-border bg-background">
            <div className="hidden min-w-[1120px] grid-cols-[190px_290px_190px_140px_190px_90px] gap-3 border-b border-border bg-muted/20 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
              <span>Mã yêu cầu</span>
              <span>Sản phẩm</span>
              <span>Khách hàng</span>
              <span>Trạng thái</span>
              <span>Ngày tạo</span>
              <span className="text-right">Thao tác</span>
            </div>
            <div className="divide-y divide-border">
              {requests.map((request) => (
                <QuoteRequestRow key={request.id} request={request} />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function QuoteRequestRow({ request }: { request: QuoteRequest }) {
  return (
    <article>
      <Link
        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 px-3 py-3 transition-colors hover:bg-muted/30 lg:hidden"
        href={`/tai-khoan/yeu-cau-bao-gia/${request.id}`}
      >
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black">{request.requestCode}</p>
          <p className="mt-1 truncate text-sm font-semibold">{getQuoteRequestVariantName(request)}</p>
          <StatusBadge status={request.status} compact />
        </div>
        <p className="self-center whitespace-nowrap text-xs font-semibold text-muted-foreground">
          SL {request.quantity}
        </p>
      </Link>

      <div className="hidden gap-3 px-4 py-4 lg:grid lg:min-w-[1120px] lg:grid-cols-[190px_290px_190px_140px_190px_90px] lg:items-center">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-black">{request.requestCode}</p>
          <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{request.requestGroupCode}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{getQuoteRequestVariantName(request)}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{getQuoteRequestProductName(request)} | SKU {getQuoteRequestSku(request)}</p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{request.customerName}</p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{request.customerEmail}</p>
        </div>
        <StatusBadge status={request.status} />
        <p className="truncate text-sm text-muted-foreground">{formatQuoteRequestDate(request.createdAt)}</p>
        <div className="flex justify-end">
          <Button asChild className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold" variant="outline">
            <Link href={`/tai-khoan/yeu-cau-bao-gia/${request.id}`}>
              <Eye className="size-4" />
              Chi tiết
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ compact = false, status }: { compact?: boolean; status: QuoteRequestStatus }) {
  return (
    <span
      className={[
        "inline-flex w-fit max-w-full items-center truncate whitespace-nowrap border font-semibold",
        getQuoteRequestStatusClass(status),
        compact ? "mt-1 h-6 px-2 text-[11px]" : "h-8 px-2.5 text-xs",
      ].join(" ")}
    >
      {getQuoteRequestStatusLabel(status)}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-border bg-muted/10 p-2 sm:p-4">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-xs sm:tracking-[0.12em]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black tracking-tight sm:mt-2 sm:text-2xl">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-80 place-items-center border border-border bg-background p-8 text-center">
      <div>
        <PackageSearch className="mx-auto size-11 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-black tracking-tight">Bạn chưa có yêu cầu báo giá nào.</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Các sản phẩm cần báo giá sẽ xuất hiện tại đây sau khi bạn gửi yêu cầu từ trang sản phẩm.
        </p>
        <Button asChild className="mt-5 h-10 rounded-none px-4 text-sm font-semibold">
          <Link href="/san-pham">
            <FileText className="size-4" />
            Xem sản phẩm
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-destructive bg-destructive/10 p-5 text-sm text-destructive">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <AlertCircle className="size-4" />
          {message}
        </p>
        <Button className="h-9 rounded-none px-3 text-xs font-semibold" onClick={onRetry} type="button" variant="outline">
          Thử lại
        </Button>
      </div>
    </div>
  );
}

function QuoteRequestListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className="border border-border p-3 sm:p-4" key={`quote-request-skeleton-${index}`}>
          <div className="flex items-start gap-4">
            <FileText className="mt-1 size-5 text-muted-foreground" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
              <Skeleton className="h-3 w-44" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
