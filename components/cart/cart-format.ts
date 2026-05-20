export function formatCartMoney(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "0 đ";
  }

  return numericValue.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + " đ";
}

export function formatTaxSource(source: string | null | undefined) {
  switch (source) {
    case "VARIANT":
      return "Biến thể";
    case "PRODUCT":
      return "Sản phẩm";
    case "CATEGORY":
      return "Danh mục";
    case "GLOBAL":
      return "Toàn shop";
    default:
      return "Không áp dụng";
  }
}
