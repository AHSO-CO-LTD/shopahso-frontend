import { NextResponse, type NextRequest } from "next/server";

type SeoRoute =
  | {
      kind: "brand";
      slug: string;
    }
  | {
      kind: "product";
      slug: string;
    }
  | {
      kind: "promotion";
      slug: string;
    };

const DEFAULT_API_URL = "http://localhost:3001";

function getApiBaseUrl(request: NextRequest) {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const serverProxyTarget = process.env.SHOPAHSO_DEV_API_PROXY_TARGET?.trim();

  if (configuredBaseUrl && configuredBaseUrl !== "same-origin") {
    return configuredBaseUrl.replace(/\/+$/, "");
  }

  if (serverProxyTarget) {
    return serverProxyTarget.replace(/\/+$/, "");
  }

  if (configuredBaseUrl === "same-origin") {
    return request.nextUrl.origin;
  }

  return DEFAULT_API_URL;
}

function parseSeoRoute(pathname: string): SeoRoute | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return null;
  }

  const [section, slug] = segments;

  if (!slug) {
    return null;
  }

  if (section === "san-pham") {
    return { kind: "product", slug };
  }

  if (section === "thuong-hieu") {
    return { kind: "brand", slug };
  }

  if (section === "khuyen-mai") {
    return { kind: "promotion", slug };
  }

  return null;
}

async function fetchStatus(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  return response.status;
}

async function getRouteStatus(request: NextRequest, route: SeoRoute) {
  const apiBaseUrl = getApiBaseUrl(request);

  if (route.kind === "product") {
    return fetchStatus(`${apiBaseUrl}/catalog/variants/${encodeURIComponent(route.slug)}`);
  }

  if (route.kind === "promotion") {
    return fetchStatus(`${apiBaseUrl}/promotions/${encodeURIComponent(route.slug)}`);
  }

  const response = await fetch(`${apiBaseUrl}/catalog/brands`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return response.status;
  }

  const brands = await response.json() as Array<{ slug?: unknown }>;
  return brands.some((brand) => brand.slug === route.slug) ? 200 : 404;
}

export async function proxy(request: NextRequest) {
  const route = parseSeoRoute(request.nextUrl.pathname);

  if (!route) {
    return NextResponse.next();
  }

  try {
    const status = await getRouteStatus(request, route);

    if (status === 404) {
      return NextResponse.rewrite(new URL("/404", request.url), { status: 404 });
    }

    if (status >= 500) {
      return new NextResponse("ShopAHSO is temporarily unavailable.", { status: 500 });
    }

    return NextResponse.next();
  } catch {
    return new NextResponse("ShopAHSO is temporarily unavailable.", { status: 500 });
  }
}

export const config = {
  matcher: [
    "/san-pham/:path*",
    "/thuong-hieu/:path*",
    "/khuyen-mai/:path*",
  ],
};
