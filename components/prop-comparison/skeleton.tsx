import { Skeleton } from "@/components/ui/skeleton";

export function PropComparisonSkeleton() {
  return (
    <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
      <div className="p-4 border-b flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>

        {/* Game selector skeleton */}
        <Skeleton className="h-10 w-full" />

        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
      </div>

      {/* Sportsbook header row */}
      <div className="border-b bg-card">
        <div className="flex">
          <div className="text-left p-4 min-w-[200px]">
            <Skeleton className="h-5 w-16" />
          </div>
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="text-center p-4 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Player rows */}
      <div className="min-h-[400px]">
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex border-b">
              <div className="p-4 min-w-[200px]">
                <Skeleton className="h-5 w-32" />
              </div>
              {Array(5)
                .fill(0)
                .map((_, j) => (
                  <div key={j} className="p-4 flex-1">
                    <div className="space-y-2">
                      <div className="border-b py-1">
                        <div className="flex items-center justify-between p-1.5 rounded-md border">
                          <Skeleton className="h-4 w-10" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-md border mt-2">
                          <Skeleton className="h-4 w-10" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
      </div>
    </div>
  );
}
