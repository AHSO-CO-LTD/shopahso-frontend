const MAX_BRAND_IMAGE_SIZE = 5 * 1024 * 1024;

export function validateBrandImageFile(file: File | undefined, label: string) {
  if (!file) {
    return `Vui lòng chọn ${label}.`;
  }

  if (!file.type.startsWith("image/")) {
    return "Chỉ hỗ trợ file ảnh.";
  }

  if (file.size > MAX_BRAND_IMAGE_SIZE) {
    return `${label} không được vượt quá 5MB.`;
  }

  return null;
}
