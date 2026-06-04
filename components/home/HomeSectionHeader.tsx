import type { ReactNode } from "react";

type HomeSectionHeaderProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  eyebrow: string;
  title: ReactNode;
};

export default function HomeSectionHeader({
  action,
  className = "",
  description,
  eyebrow,
  title,
}: HomeSectionHeaderProps) {
  return (
    <div className={`${className} flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between`}>
      <div className="max-w-3xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">{title}</h2>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
