import type { CheckoutOrder, CheckoutPreview } from "@/lib/checkout/types";

const CHECKOUT_ITEM_IDS_KEY = "ahso_checkout_item_ids";
const CHECKOUT_PREVIEW_KEY = "ahso_checkout_preview";
const CHECKOUT_ORDER_KEY = "ahso_checkout_order";

function readJson<T>(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function getStoredCheckoutItemIds() {
  return readJson<string[]>(CHECKOUT_ITEM_IDS_KEY) ?? [];
}

export function setStoredCheckoutItemIds(itemIds: string[]) {
  writeJson(CHECKOUT_ITEM_IDS_KEY, itemIds);
}

export function getStoredCheckoutPreview() {
  return readJson<CheckoutPreview>(CHECKOUT_PREVIEW_KEY);
}

export function setStoredCheckoutPreview(preview: CheckoutPreview) {
  writeJson(CHECKOUT_PREVIEW_KEY, preview);
}

export function getStoredCheckoutOrder() {
  return readJson<CheckoutOrder>(CHECKOUT_ORDER_KEY);
}

export function setStoredCheckoutOrder(order: CheckoutOrder) {
  writeJson(CHECKOUT_ORDER_KEY, order);
}
