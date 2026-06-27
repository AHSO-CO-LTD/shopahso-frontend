"use client";

import type { ProductStatus } from "@/lib/product/types";

type ProductManagementFiltersProps = {
  filteredCount: number;
  hasFilters: boolean;
  searchKeyword: string;
  statusFilter: "" | ProductStatus;
  totalProducts: number;
  onReset: () => void;
  onSearchChange: (keyword: string) => void;
  onStatusChange: (status: "" | ProductStatus) => void;
};

export default function ProductManagementFilters({
  filteredCount,
  hasFilters,
  searchKeyword,
  statusFilter,
  totalProducts,
  onReset,
  onSearchChange,
  onStatusChange,
}: ProductManagementFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
      <input
        aria-label="Tìm kiếm sản phẩm"
        className="h-9 w-56 border border-border bg-background px-3 text-sm outline-none transition-colors hover:border-primary focus:border-primary"
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Tên hoặc slug..."
        type="search"
        value={searchKeyword}
      />

      <select
        aria-label="Lọc theo trạng thái"
        className="h-9 cursor-pointer border border-border bg-background px-2 text-sm outline-none transition-colors hover:border-primary focus:border-primary"
        onChange={(e) => onStatusChange(e.target.value as "" | ProductStatus)}
        value={statusFilter}
      >
        <option value="">Tất cả trạng thái</option>
        <option value="PUBLISHED">PUBLISHED</option>
        <option value="DRAFT">DRAFT</option>
      </select>

      {hasFilters && (
        <button
          type="button"
          className="h-9 cursor-pointer border border-border bg-background px-3 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          onClick={onReset}
        >
          Xóa bộ lọc
        </button>
      )}

      <span className="ml-auto text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{filteredCount}</span>
        {filteredCount !== totalProducts ? `/${totalProducts}` : ""} sản phẩm
      </span>
    </div>
  );
}
