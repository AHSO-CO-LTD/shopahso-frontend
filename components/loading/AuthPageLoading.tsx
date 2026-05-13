import { Skeleton } from "@/components/ui/skeleton";

export default function AuthPageLoading() {
  return (
    <section className="flex min-h-[calc(100vh-10rem)] items-center border-t border-border bg-white">
      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_520px] lg:items-stretch">
        <div className="space-y-8 border border-border bg-muted/40 p-8 lg:p-10">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-14 w-full max-w-lg" />
          <Skeleton className="h-20 w-full max-w-xl" />
          <div className="grid gap-4 border-t border-border pt-8 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 border border-border bg-background p-8 lg:p-10">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
    </section>
  );
}
