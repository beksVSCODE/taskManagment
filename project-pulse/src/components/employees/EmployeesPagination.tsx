import { Button } from '@/components/ui/button';

interface EmployeesPaginationProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

function getPages(page: number, totalPages: number): number[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = new Set<number>([1, totalPages, page - 1, page, page + 1]);
    return Array.from(pages)
        .filter(p => p >= 1 && p <= totalPages)
        .sort((a, b) => a - b);
}

export function EmployeesPagination({ page, totalPages, onChange }: EmployeesPaginationProps) {
    if (totalPages <= 1) return null;

    const pages = getPages(page, totalPages);

    return (
        <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-border/60 bg-card p-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
                Страница <span className="font-medium text-foreground">{page}</span> из{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
            </p>

            <div className="flex items-center gap-1">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                >
                    Назад
                </Button>

                {pages.map((p, idx) => {
                    const prev = pages[idx - 1];
                    const showEllipsis = prev && p - prev > 1;

                    return (
                        <div key={p} className="flex items-center gap-1">
                            {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
                            <Button
                                size="sm"
                                variant={p === page ? 'default' : 'ghost'}
                                className="h-8 w-8 px-0"
                                onClick={() => onChange(p)}
                            >
                                {p}
                            </Button>
                        </div>
                    );
                })}

                <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => onChange(page + 1)}
                >
                    Вперёд
                </Button>
            </div>
        </div>
    );
}
