import type { Metadata } from "next";
import Script from "next/script";
import { Be_Vietnam_Pro, Roboto_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AnalyticsScripts from "@/components/integrations/AnalyticsScripts";
import AppChrome from "@/components/layout/AppChrome";
import { AuthProvider } from "@/components/providers/AuthProvider";
import JsonLd from "@/components/seo/JsonLd";
import { absoluteUrl, SHOP_AHSO_DESCRIPTION, SITE_URL } from "@/lib/seo/config";
import { buildOrganizationJsonLd } from "@/lib/seo/schema";
import "./globals.css";

const fontSans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

const fontMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ShopAHSO | Linh kiện công nghiệp chính xác",
    template: "%s | ShopAHSO",
  },
  description: SHOP_AHSO_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    description: SHOP_AHSO_DESCRIPTION,
    images: [absoluteUrl("/logo.png")],
    locale: "vi_VN",
    siteName: "ShopAHSO",
    title: "ShopAHSO | Linh kiện công nghiệp chính xác",
    type: "website",
    url: SITE_URL,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const historyRestoreReloadScript = `
(function () {
  var restoreKeyPrefix = "shopahso:history-restore:";

  function getNavigationType() {
    var entries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType("navigation")
      : [];
    return entries && entries[0] ? entries[0].type : "";
  }

  function getRestoreKey() {
    return restoreKeyPrefix + window.location.pathname + window.location.search;
  }

  function clearRestoreKeys() {
    try {
      Object.keys(window.sessionStorage).forEach(function (key) {
        if (key.indexOf(restoreKeyPrefix) === 0) {
          window.sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      // Storage can be unavailable in strict privacy modes.
    }
  }

  function reloadOnce() {
    var key = getRestoreKey();

    try {
      if (window.sessionStorage.getItem(key) === "1") {
        return;
      }

      window.sessionStorage.setItem(key, "1");
    } catch (error) {
      if (window.__shopahsoHistoryRestoreReloaded) {
        return;
      }

      window.__shopahsoHistoryRestoreReloaded = true;
    }

    window.location.reload();
  }

  function isHistoryRestore(event) {
    return Boolean(event && event.persisted) || getNavigationType() === "back_forward";
  }

  window.addEventListener("pageshow", function (event) {
    if (isHistoryRestore(event)) {
      reloadOnce();
    }
  });

  if (getNavigationType() === "back_forward") {
    reloadOnce();
  } else {
    clearRestoreKeys();
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col font-sans selection:bg-primary selection:text-white">
        <Script
          id="shopahso-history-restore-reload"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: historyRestoreReloadScript }}
        />
        <AnalyticsScripts />
        <JsonLd id="shopahso-organization-jsonld" data={buildOrganizationJsonLd()} />
        <AuthProvider>
          <AppChrome>{children}</AppChrome>
          <Toaster
            duration={2200}
            gap={8}
            offset={16}
            position="bottom-right"
            richColors
            toastOptions={{
              classNames: {
                description: "text-xs text-muted-foreground",
                title: "text-sm font-semibold",
                toast: "rounded-none border border-border bg-background text-foreground shadow-none",
              },
            }}
            visibleToasts={2}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
