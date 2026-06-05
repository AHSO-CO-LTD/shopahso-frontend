import { Skeleton } from "@/components/ui/skeleton";

export default function AdminStatisticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-0 border border-border md:grid-cols-2 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="border border-border px-5 py-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-6 h-8 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="border border-border px-5 py-5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="mt-6 h-44 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
