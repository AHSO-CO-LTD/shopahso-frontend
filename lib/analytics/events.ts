export type AnalyticsEventName = "add_to_cart" | "search_sku" | "view_datasheet";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    mixpanel?: {
      track?: (eventName: string, properties?: AnalyticsProperties) => void;
    };
  }
}

export function trackAnalyticsEvent(eventName: AnalyticsEventName, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", eventName, properties);
  window.mixpanel?.track?.(eventName, properties);
}
