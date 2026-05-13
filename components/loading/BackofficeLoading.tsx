import { Skeleton } from "@/components/ui/skeleton";

type BackofficeLoadingProps = {
  label: string;
};

export default function BackofficeLoading({ label }: BackofficeLoadingProps) {
  return (
    <section className="h-screen overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <aside className="hidden h-full w-[280px] border-r border-border bg-muted/25 lg:block">
          <div className="space-y-4 border-b border-border px-4 py-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="space-y-2 px-3 py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full border border-border" />
            ))}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <header className="border-b border-border px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-56" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {label}
              </p>
              <div className="grid gap-0 border border-border sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full border border-border" />
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-0 border border-border md:grid-cols-2 2xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full border border-border" />
                ))}
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <Skeleton className="h-96 w-full border border-border" />
                <Skeleton className="h-96 w-full border border-border" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}
