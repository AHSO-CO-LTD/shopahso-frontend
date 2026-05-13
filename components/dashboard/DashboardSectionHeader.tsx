import type { ReactNode } from "react";

type DashboardSectionHeaderProps = {
  overline: string;
  title: string;
  suffix?: ReactNode;
};

export default function DashboardSectionHeader({
  overline,
  title,
  suffix,
}: DashboardSectionHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {overline}
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">{title}</h2>
      </div>
      {suffix}
    </header>
  );
}
