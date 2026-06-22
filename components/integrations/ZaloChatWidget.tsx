import Script from "next/script";

export default function ZaloChatWidget() {
  const oaId = process.env.NEXT_PUBLIC_ZALO_OA_ID?.trim();
  const zaloPhone = process.env.NEXT_PUBLIC_ZALO_PHONE?.replace(/\D/g, "");

  if (oaId) {
    return (
      <>
        <div
          className="zalo-chat-widget"
          data-oaid={oaId}
          data-welcome-message="ShopAHSO có thể hỗ trợ gì cho bạn?"
          data-autopopup="0"
          data-width="350"
          data-height="420"
        />
        <Script id="shopahso-zalo-sdk" src="https://sp.zalo.me/plugins/sdk.js" strategy="afterInteractive" />
      </>
    );
  }

  if (zaloPhone) {
    return (
      <a
        aria-label="Chat Zalo với ShopAHSO"
        className="fixed bottom-4 right-4 z-50 inline-flex h-12 items-center justify-center border border-primary bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg sm:hidden"
        href={`https://zalo.me/${zaloPhone}`}
        rel="noopener noreferrer"
        target="_blank"
      >
        Zalo
      </a>
    );
  }

  return null;
}
