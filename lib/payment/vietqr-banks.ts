import type { VietQrBank, VietQrBanksResponse } from "@/lib/payment/types";

const VIETQR_BANKS_URL = "https://api.vietqr.io/v2/banks";

export async function fetchVietQrBanks(signal?: AbortSignal) {
  const response = await fetch(VIETQR_BANKS_URL, { signal });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách ngân hàng từ VietQR.");
  }

  const payload = (await response.json()) as VietQrBanksResponse;

  if (!Array.isArray(payload.data)) {
    throw new Error("Dữ liệu ngân hàng VietQR không hợp lệ.");
  }

  return payload.data
    .filter((bank): bank is VietQrBank => Boolean(bank.bin && bank.name))
    .sort((a, b) => (a.shortName || a.name).localeCompare(b.shortName || b.name, "vi"));
}
