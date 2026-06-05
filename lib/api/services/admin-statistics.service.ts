import { authenticatedApiRequest } from "@/lib/auth/authenticated-request";
import type {
  AdminDashboardStatistics,
  OrderStatistics,
  ProductStatistics,
  QuoteRequestStatistics,
  StatisticsQuery,
  UserStatistics,
  WebsiteStatistics,
} from "@/lib/admin-statistics/types";

function normalizeStatisticsQuery(query: StatisticsQuery = {}) {
  return {
    ...query,
    topLimit: query.topLimit ?? undefined,
  };
}

export function getAdminDashboardStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<AdminDashboardStatistics>("/admin/statistics/dashboard", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}

export function getAdminWebsiteStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<WebsiteStatistics>("/admin/statistics/website", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}

export function getAdminUserStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<UserStatistics>("/admin/statistics/users", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}

export function getAdminProductStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<ProductStatistics>("/admin/statistics/products", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}

export function getAdminOrderStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<OrderStatistics>("/admin/statistics/orders", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}

export function getAdminQuoteRequestStatistics(query: StatisticsQuery = {}) {
  return authenticatedApiRequest<QuoteRequestStatistics>("/admin/statistics/quote-requests", {
    method: "GET",
    query: normalizeStatisticsQuery(query),
  });
}
