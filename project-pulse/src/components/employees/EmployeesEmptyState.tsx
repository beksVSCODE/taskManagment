import { SearchX } from 'lucide-react';

export function EmployeesEmptyState({
    title = 'Ничего не найдено',
    description = 'Попробуйте изменить параметры фильтрации.',
}: {
    title?: string;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-border/60 bg-card p-10 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <SearchX className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
