export const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || "https://shop.ahso.vn");

export const SHOP_AHSO_CONTACT = {
  addressCountry: "VN",
  addressLocality: "Dĩ An",
  addressRegion: "Thành phố Hồ Chí Minh",
  email: "sales@ahso.vn",
  name: "ShopAHSO",
  phone: "+84901951351",
  streetAddress: "39/15 Đường Cao Bá Quát, Khu Phố Đông Tân",
};

export const SHOP_AHSO_DESCRIPTION =
  "Hệ thống phân phối linh kiện, vật tư công nghiệp chính xác, tin cậy và hiệu suất cao.";

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export function stripHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateSeoText(value: string, maxLength = 155) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trim()}…`;
}
