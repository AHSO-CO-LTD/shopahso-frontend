export type StatisticsPreset = "today" | "7d" | "30d" | "month" | "year";

export type StatisticsInterval = "day" | "week" | "month";

export type StatisticsQuery = {
  preset?: StatisticsPreset;
  from?: string;
  to?: string;
  interval?: StatisticsInterval;
  topLimit?: number;
};

export type StatisticsMeta = {
  from: string;
  to: string;
  interval: StatisticsInterval;
  topLimit: number;
};

export type ChartSeries = {
  key: string;
  label: string;
  points: Array<{
    x: string;
    y: number;
  }>;
};

export type OrderSeries = {
  key: "orders";
  label: string;
  points: Array<{
    x: string;
    y: number;
    totalOrders: number;
    paidOrders: number;
    cancelledOrders: number;
  }>;
};

export type RevenueSeries = {
  key: "revenue";
  label: string;
  points: Array<{
    x: string;
    y: number;
    revenue: string;
    orderCount: number;
  }>;
};

export type BreakdownItem = {
  key: string;
  label: string;
  value: number;
};

export type StatisticsCard = {
  key: string;
  label: string;
  value: number | string | null;
};

export type TopVariant = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productId: string;
  productName: string;
  imageUrl: string | null;
  metricKey: string;
  metricValue: number;
  quantity?: number;
  revenue?: string;
  stockQuantity: number;
  isActive: boolean;
  isInStock: boolean;
  contactForPrice: boolean;
  price: string | null;
};

export type AlertItem = {
  key: string;
  label: string;
  value: number;
  severity: "info" | "warning" | "critical";
  href?: string;
};

export type StatisticsComparisonMetric = {
  current: number | string;
  previous: number | string;
  changePercent: number;
};

export type StatisticsComparison = {
  previousFrom: string;
  previousTo: string;
  metrics: {
    revenue: StatisticsComparisonMetric;
    orders: StatisticsComparisonMetric;
    paidOrders: StatisticsComparisonMetric;
    newUsers: StatisticsComparisonMetric;
    quoteRequests: StatisticsComparisonMetric;
  };
};

export type DashboardRates = {
  paidOrderRate: number;
  cancellationRate: number;
  quoteCompletionRate: number;
  outOfStockRate: number;
  contactForPriceRate: number;
};

export type WebsiteStatistics = {
  meta: StatisticsMeta & {
    trackingAvailable: false;
    trackingMessage: string;
  };
  summary: {
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    visits: null;
    sessions: null;
  };
  cards: StatisticsCard[];
  series: {
    newUsers: ChartSeries;
    visits: ChartSeries;
    sessions: ChartSeries;
  };
};

export type UserStatistics = {
  meta: StatisticsMeta;
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsers: number;
  };
  cards: StatisticsCard[];
  series: {
    newUsers: ChartSeries;
  };
  breakdowns: {
    roles: BreakdownItem[];
  };
};

export type ProductStatistics = {
  meta: StatisticsMeta;
  summary: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    publishedProducts: number;
    draftProducts: number;
    newProducts: number;
    totalVariants: number;
    activeVariants: number;
    inactiveVariants: number;
    newVariants: number;
    outOfStockVariants: number;
    contactForPriceVariants: number;
  };
  rates: {
    outOfStockRate: number;
    contactForPriceRate: number;
  };
  cards: StatisticsCard[];
  series: {
    newProducts: ChartSeries;
    newVariants: ChartSeries;
  };
  breakdowns: {
    productStatus: BreakdownItem[];
    stock: BreakdownItem[];
  };
  topItems: {
    viewedVariants: TopVariant[];
    purchasedVariants: TopVariant[];
  };
};

export type OrderStatistics = {
  meta: StatisticsMeta;
  summary: {
    totalOrders: number;
    paidOrders: number;
    unpaidOrders: number;
    cancelledOrders: number;
    revenue: string;
    averageOrderValue: string;
    cancellationRate: number;
  };
  rates: {
    paidOrderRate: number;
    cancellationRate: number;
  };
  cards: StatisticsCard[];
  series: {
    orders: OrderSeries;
    revenue: RevenueSeries;
  };
  breakdowns: {
    status: BreakdownItem[];
    paymentStatus: BreakdownItem[];
    fulfillmentStatus: BreakdownItem[];
  };
};

export type QuoteRequestStatistics = {
  meta: StatisticsMeta;
  summary: {
    totalQuoteRequests: number;
    pendingQuoteRequests: number;
    quotedQuoteRequests: number;
    closedQuoteRequests: number;
    quoteCompletionRate: number;
  };
  rates: {
    quoteCompletionRate: number;
  };
  cards: StatisticsCard[];
  series: {
    quoteRequests: ChartSeries;
  };
  breakdowns: {
    status: BreakdownItem[];
  };
};

export type AdminDashboardStatistics = {
  meta: StatisticsMeta;
  comparison: StatisticsComparison;
  summary: {
    registeredUsers: number;
    newUsers: number;
    products: number;
    newProducts: number;
    variants: number;
    orders: number;
    paidOrders: number;
    revenue: string;
    quoteRequests: number;
    pendingQuoteRequests: number;
    visits: null | number;
  };
  rates: DashboardRates;
  alerts: AlertItem[];
  cards: StatisticsCard[];
  series: {
    users: ChartSeries;
    orders: OrderSeries;
    revenue: RevenueSeries;
    quoteRequests: ChartSeries;
  };
  breakdowns: {
    orderStatus: BreakdownItem[];
    paymentStatus: BreakdownItem[];
    fulfillmentStatus: BreakdownItem[];
    quoteRequestStatus: BreakdownItem[];
    userRoles: BreakdownItem[];
    stock: BreakdownItem[];
  };
  topItems: {
    viewedProducts: TopVariant[];
    purchasedProducts: TopVariant[];
  };
  modules: {
    website: WebsiteStatistics;
    users: UserStatistics;
    products: ProductStatistics;
    orders: OrderStatistics;
    quoteRequests: QuoteRequestStatistics;
  };
};
