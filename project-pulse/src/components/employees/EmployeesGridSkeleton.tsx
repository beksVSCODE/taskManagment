import { Skeleton } from '@/components/ui/skeleton';

export function EmployeesGridSkeleton({ count = 9 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>

                    <div className="mb-4 grid grid-cols-3 gap-2">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>

                    <div className="rounded-lg border border-border/60 p-3">
                        <Skeleton className="mb-2 h-3 w-24" />
                        <div className="grid grid-cols-2 gap-2">
                            <Skeleton className="h-11 w-full" />
                            <Skeleton className="h-11 w-full" />
                            <Skeleton className="h-11 w-full" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
