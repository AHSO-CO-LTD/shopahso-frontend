"use client";

import type { BackofficeCategory } from "@/lib/category/types";

type CategoryParentSelectProps = {
  categories: BackofficeCategory[];
  disabled?: boolean;
  onChange: (value: string) => void;
  value: string;
};

export default function CategoryParentSelect({
  categories,
  disabled = false,
  onChange,
  value,
}: CategoryParentSelectProps) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-semibold">Danh mục cha</span>
      <select
        className="h-11 cursor-pointer border border-border bg-background px-3 outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Không có danh mục cha</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name} ({category.slug})
          </option>
        ))}
      </select>
    </label>
  );
}
