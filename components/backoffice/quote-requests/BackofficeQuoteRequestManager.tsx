"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatQuoteRequestDate,
  getQuoteRequestProductName,
  getQuoteRequestSku,
  getQuoteRequestStatusClass,
  getQuoteRequestStatusLabel,
  getQuoteRequestVariantName,
  QUOTE_REQUEST_STATUSES,
} from "@/components/quote-requests/quote-request-display";
import {
  claimBackofficeQuoteRequest,
  listBackofficeQuoteRequests,
  QuoteRequestApiError,
  updateBackofficeQuoteRequestStatus,
} from "@/lib/api/services/quote-requests.service";
import type {
  BackofficeQuoteRequestFilters,
  QuoteRequest,
  QuoteRequestStatus,
} from "@/lib/quote-request/types";

type QuoteRequestGroup = {
  code: string;
  items: QuoteRequest[];
};

type StatusDraft = {
  status: QuoteRequestStatus;
  staffNote: string;
};

const statusFilters: Array<{ label: string; value: QuoteRequestStatus | "ALL" }> = [
  { label: "Tất cả", value: "ALL" },
  ...QUOTE_REQUEST_STATUSES.map((status) => ({
    label: getQuoteRequestStatusLabel(status),
    value: status,
  })),
];

function groupQuoteRequests(requests: QuoteRequest[]) {
  const groups = new Map<string, QuoteRequest[]>();

  requests.forEach((request) => {
    const code = request.requestGroupCode || request.requestCode;
    groups.set(code, [...(groups.get(code) ?? []), request]);
  });

  return Array.from(groups.entries())
    .map(([code, items]) => ({
      code,
      items: items.sort((first, second) => first.createdAt.localeCompare(second.createdAt)),
    }))
    .sort((first, second) => second.items[0]?.createdAt.localeCompare(first.items[0]?.createdAt ?? "") ?? 0);
}

function getGroupCustomer(group: QuoteRequestGroup) {
  const firstItem = group.items[0];

  return {
    email: firstItem?.customerEmail ?? "Chưa có email",
    name: firstItem?.customerName ?? "Khách hàng",
    phone: firstItem?.customerPhone ?? "Chưa có số điện thoại",
  };
}

function getGroupPendingItems(group: QuoteRequestGroup) {
  return group.items.filter((item) => item.status === "PENDING" && !item.claimedByStaffId);
}

export function BackofficeQuoteRequestManager() {
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState("");
  const [filters, setFilters] = useState<BackofficeQuoteRequestFilters>({});
  const [searchDraft, setSearchDraft] = useState({
    email: "",
    phoneNumber: "",
    requestCode: "",
  });
  const [statusDraft, setStatusDraft] = useState<StatusDraft>({
    status: "CLOSED",
    staffNote: "",
  });
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const groups = useMemo(() => groupQuoteRequests(requests), [requests]);
  const selectedGroup = useMemo(() => {
    if (groups.length === 0) {
      return null;
    }

    return groups.find((group) => group.code === selectedGroupCode) ?? groups[0];
  }, [groups, selectedGroupCode]);

  const metrics = useMemo(() => ({
    pending: requests.filter((request) => request.status === "PENDING").length,
    quoted: requests.filter((request) => request.status === "QUOTED").length,
    total: requests.length,
  }), [requests]);

  const loadRequests = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const response = await listBackofficeQuoteRequests(filters);
      setRequests(response);
      setSelectedGroupCode((currentCode) => {
        if (response.some((request) => request.requestGroupCode === currentCode || request.requestCode === currentCode)) {
          return currentCode;
        }

        return response[0]?.requestGroupCode ?? response[0]?.requestCode ?? "";
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải danh sách yêu cầu báo giá.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRequests]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isSubmitting) {
        void loadRequests({ silent: true });
      }
    }, 10_000);

    return () => window.clearInterval(intervalId);
  }, [isSubmitting, loadRequests]);

  function applySearchFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((currentFilters) => ({
      ...currentFilters,
      email: searchDraft.email.trim() || undefined,
      phoneNumber: searchDraft.phoneNumber.trim() || undefined,
      requestCode: searchDraft.requestCode.trim() || undefined,
    }));
  }

  async function handleClaimGroup() {
    if (!selectedGroup) {
      toast.warning("Vui lòng chọn nhóm yêu cầu cần xử lý.");
      return;
    }

    const pendingItems = getGroupPendingItems(selectedGroup);
    if (pendingItems.length === 0) {
      toast.warning("Nhóm này không còn yêu cầu đang chờ nhận xử lý.");
      return;
    }

    const loadingToastId = toast.loading("Đang nhận yêu cầu báo giá...");
    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        pendingItems.map((item) =>
          claimBackofficeQuoteRequest(item.id, {
            staffNote: "Đã nhận xử lý và sẽ liên hệ khách.",
          }),
        ),
      );
      const rejectedConflict = results.some(
        (result) => result.status === "rejected" && result.reason instanceof QuoteRequestApiError && result.reason.status === 409,
      );
      const rejectedOther = results.find((result) => result.status === "rejected");

      if (rejectedConflict) {
        toast.warning("Yêu cầu này vừa được nhân viên khác nhận xử lý.", { id: loadingToastId });
      } else if (rejectedOther?.status === "rejected") {
        throw rejectedOther.reason;
      } else {
        toast.success("Bạn đã nhận xử lý yêu cầu này.", { id: loadingToastId });
      }

      await loadRequests({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể nhận xử lý yêu cầu báo giá.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedGroup) {
      toast.warning("Vui lòng chọn nhóm yêu cầu cần cập nhật.");
      return;
    }

    const loadingToastId = toast.loading("Đang cập nhật yêu cầu báo giá...");
    setIsSubmitting(true);

    try {
      const results = await Promise.allSettled(
        selectedGroup.items.map((item) =>
          updateBackofficeQuoteRequestStatus(item.id, {
            status: statusDraft.status,
            staffNote: statusDraft.staffNote.trim() || undefined,
          }),
        ),
      );
      const rejectedConflict = results.some(
        (result) => result.status === "rejected" && result.reason instanceof QuoteRequestApiError && result.reason.status === 409,
      );
      const rejectedOther = results.find((result) => result.status === "rejected");

      if (rejectedConflict) {
        toast.warning("Yêu cầu này vừa được nhân viên khác nhận xử lý.", { id: loadingToastId });
      } else if (rejectedOther?.status === "rejected") {
        throw rejectedOther.reason;
      } else {
        toast.success("Đã cập nhật trạng thái yêu cầu báo giá.", { id: loadingToastId });
        setIsStatusPanelOpen(false);
      }

      await loadRequests({ silent: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật trạng thái yêu cầu báo giá.", {
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Nhân viên</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Yêu cầu báo giá</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Gom yêu cầu theo mã nhóm, nhận xử lý và cập nhật trạng thái sau khi liên hệ khách.
          </p>
        </div>

        <Button
          className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold"
          disabled={isLoading}
          onClick={() => void loadRequests()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </header>

      <section className="mb-4 grid gap-3 md:grid-cols-3">
        <Metric label="Tổng yêu cầu" value={String(metrics.total)} />
        <Metric label="Đang chờ" value={String(metrics.pending)} />
        <Metric label="Đã nhận xử lý" value={String(metrics.quoted)} />
      </section>

      <section className="mb-4 grid gap-3 border border-border bg-background p-3">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              className={[
                "inline-flex h-9 cursor-pointer items-center justify-center border px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary",
                (filters.status ?? "ALL") === filter.value ? "border-primary bg-primary text-primary-foreground hover:text-primary-foreground" : "border-border bg-background",
              ].join(" ")}
              key={filter.value}
              onClick={() => setFilters((currentFilters) => ({
                ...currentFilters,
                status: filter.value === "ALL" ? undefined : filter.value,
              }))}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <form className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]" onSubmit={applySearchFilters}>
          <FilterField
            label="Mã RFQ"
            value={searchDraft.requestCode}
            onChange={(value) => setSearchDraft((current) => ({ ...current, requestCode: value }))}
          />
          <FilterField
            label="Email"
            type="email"
            value={searchDraft.email}
            onChange={(value) => setSearchDraft((current) => ({ ...current, email: value }))}
          />
          <FilterField
            label="Số điện thoại"
            value={searchDraft.phoneNumber}
            onChange={(value) => setSearchDraft((current) => ({ ...current, phoneNumber: value }))}
          />
          <div className="flex items-end gap-2">
            <Button className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold" type="submit">
              <Search className="size-4" />
              Lọc
            </Button>
            <Button
              className="h-10 cursor-pointer rounded-none px-3 text-sm font-semibold"
              onClick={() => {
                setSearchDraft({ email: "", phoneNumber: "", requestCode: "" });
                setFilters((currentFilters) => ({ status: currentFilters.status }));
              }}
              type="button"
              variant="outline"
            >
              Xóa
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_440px]">
        <div className="border border-border bg-background">
          <div className="border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Nhóm yêu cầu</h2>
            <p className="mt-1 text-xs text-muted-foreground">Chọn một nhóm để xem sản phẩm cần báo giá và thao tác.</p>
          </div>

          {isLoading ? (
            <GroupListSkeleton />
          ) : errorMessage ? (
            <div className="p-5 text-sm text-destructive">{errorMessage}</div>
          ) : groups.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">Không có yêu cầu báo giá phù hợp với bộ lọc hiện tại.</div>
          ) : (
            <div className="divide-y divide-border">
              {groups.map((group) => (
                <GroupRow
                  group={group}
                  isSelected={selectedGroup?.code === group.code}
                  key={group.code}
                  onSelect={() => setSelectedGroupCode(group.code)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="h-fit border border-border bg-background xl:sticky xl:top-4">
          <div className="border-b border-border px-4 py-3 md:px-5">
            <h2 className="text-base font-black tracking-tight">Chi tiết xử lý</h2>
            <p className="mt-1 text-xs text-muted-foreground">Thao tác áp dụng cho các yêu cầu trong nhóm đang chọn.</p>
          </div>

          {!selectedGroup ? (
            <div className="p-5 text-sm text-muted-foreground">Chọn một nhóm yêu cầu để xử lý.</div>
          ) : (
            <div className="space-y-5 p-4 md:p-5">
              <GroupDetail group={selectedGroup} />

              <div className="grid gap-2 border-y border-border py-4">
                <Button
                  className="h-10 cursor-pointer justify-start rounded-none px-3 text-sm font-semibold"
                  disabled={isSubmitting || getGroupPendingItems(selectedGroup).length === 0}
                  onClick={() => void handleClaimGroup()}
                  type="button"
                >
                  <CheckCircle2 className="size-4" />
                  Nhận xử lý
                </Button>
                <Button
                  className="h-10 cursor-pointer justify-start rounded-none px-3 text-sm font-semibold"
                  disabled={isSubmitting}
                  onClick={() => setIsStatusPanelOpen((current) => !current)}
                  type="button"
                  variant="outline"
                >
                  <FileText className="size-4" />
                  Cập nhật trạng thái
                </Button>
              </div>

              {isStatusPanelOpen ? (
                <form className="grid gap-4 border border-border bg-muted/10 p-3" onSubmit={handleStatusSubmit}>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Trạng thái
                    </span>
                    <select
                      className="h-10 cursor-pointer border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
                      disabled={isSubmitting}
                      onChange={(event) => setStatusDraft((current) => ({ ...current, status: event.target.value as QuoteRequestStatus }))}
                      value={statusDraft.status}
                    >
                      {QUOTE_REQUEST_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {getQuoteRequestStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Ghi chú nhân viên
                    </span>
                    <textarea
                      className="min-h-24 resize-y border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                      disabled={isSubmitting}
                      maxLength={500}
                      onChange={(event) => setStatusDraft((current) => ({ ...current, staffNote: event.target.value }))}
                      placeholder="Nội dung trao đổi hoặc lý do cập nhật trạng thái"
                      value={statusDraft.staffNote}
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button
                      className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold"
                      disabled={isSubmitting}
                      onClick={() => setIsStatusPanelOpen(false)}
                      type="button"
                      variant="outline"
                    >
                      <XCircle className="size-4" />
                      Đóng
                    </Button>
                    <Button
                      className="h-9 cursor-pointer rounded-none px-3 text-xs font-semibold"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      <CheckCircle2 className="size-4" />
                      Lưu
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FilterField({
  label,
  onChange,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      <input
        className="h-10 border border-border bg-background px-3 outline-none transition-colors hover:border-primary focus:border-primary"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function GroupRow({
  group,
  isSelected,
  onSelect,
}: {
  group: QuoteRequestGroup;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const customer = getGroupCustomer(group);
  const pendingCount = group.items.filter((item) => item.status === "PENDING").length;
  const firstItem = group.items[0];

  return (
    <button
      className={[
        "grid w-full cursor-pointer gap-3 px-4 py-4 text-left transition-colors md:grid-cols-[minmax(0,1fr)_150px_120px]",
        isSelected ? "bg-muted/30" : "hover:bg-muted/15",
      ].join(" ")}
      onClick={onSelect}
      type="button"
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-sm font-black">{group.code}</p>
        <p className="mt-1 truncate text-sm font-semibold">{customer.name}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{customer.email} | {customer.phone}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sản phẩm</p>
        <p className="mt-1 text-sm font-semibold">{group.items.length} dòng</p>
        <p className="mt-1 text-xs text-muted-foreground">{pendingCount} đang chờ</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ngày tạo</p>
        <p className="mt-1 text-sm text-muted-foreground">{formatQuoteRequestDate(firstItem?.createdAt)}</p>
      </div>
    </button>
  );
}

function GroupDetail({ group }: { group: QuoteRequestGroup }) {
  const customer = getGroupCustomer(group);

  return (
    <>
      <div>
        <p className="font-mono text-lg font-black">{group.code}</p>
        <p className="mt-1 text-sm font-semibold">{customer.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{customer.email} | {customer.phone}</p>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-black tracking-tight">Sản phẩm cần báo giá</h3>
        <div className="divide-y divide-border border border-border">
          {group.items.map((item) => (
            <article className="grid gap-2 p-3 text-sm" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{getQuoteRequestVariantName(item)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getQuoteRequestProductName(item)} | SKU {getQuoteRequestSku(item)} | SL {item.quantity}
                  </p>
                </div>
                <span className={`inline-flex shrink-0 border px-2 py-1 text-[11px] font-semibold ${getQuoteRequestStatusClass(item.status)}`}>
                  {getQuoteRequestStatusLabel(item.status)}
                </span>
              </div>
              {item.customerNote ? (
                <p className="border border-border bg-muted/10 p-2 text-xs leading-5 text-muted-foreground">
                  Khách ghi chú: {item.customerNote}
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Nhân viên: {item.claimedByStaff?.fullName || item.claimedByStaff?.email || "Chưa nhận xử lý"}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function GroupListSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_150px_120px]" key={index}>
          <div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-4 w-48" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
