import { Skeleton } from "@/components/ui/skeleton";

export default function WebShellLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95">
        <div className="container mx-auto flex h-20 items-center justify-between gap-8 px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="hidden h-10 w-80 md:block" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="hidden h-10 w-28 sm:block" />
          </div>
        </div>
      </header>

      <main className="flex-1 border-t border-border bg-background">
        <section className="industrial-grid py-16 lg:py-28">
          <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[1fr_minmax(0,680px)] lg:items-center">
            <div className="space-y-5">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-16 w-full max-w-xl" />
              <Skeleton className="h-16 w-full max-w-lg" />
              <Skeleton className="h-24 w-full max-w-2xl" />
              <div className="flex gap-3">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-12 w-48" />
              </div>
            </div>
            <Skeleton className="aspect-[4/3] w-full border border-border" />
          </div>
        </section>
      </main>

      <footer className="border-t-8 border-primary bg-foreground py-14">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="h-5 w-24 bg-white/20" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-5/6 bg-white/10" />
                <Skeleton className="h-4 w-4/6 bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
