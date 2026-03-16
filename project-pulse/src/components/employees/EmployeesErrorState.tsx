import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmployeesErrorState({
    message,
    onRetry,
}: {
    message: string;
    onRetry?: () => void;
}) {
    return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
            <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
                <div className="min-w-0 flex-1">
                    <p className="font-semibold text-destructive">Ошибка загрузки сотрудников</p>
                    <p className="mt-1 text-destructive/90">{message}</p>
                    {onRetry && (
                        <Button className="mt-3" size="sm" variant="outline" onClick={onRetry}>
                            Повторить
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
