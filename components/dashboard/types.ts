import type { LucideIcon } from "lucide-react";

export type DashboardSignal = {
  label: string;
  value: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
};

export type DashboardWorkstream = {
  icon: LucideIcon;
  title: string;
  status: string;
  summary?: string;
};

export type DashboardQueueItem = {
  title: string;
  value: string;
};

export type DashboardPanel = {
  icon: LucideIcon;
  title: string;
  items: string[];
};
