import { WorkloadStatus } from '@/types';
import { cn } from '@/lib/utils';

interface WorkloadIndicatorProps {
    activeTasks: number;
    status?: WorkloadStatus;
    compact?: boolean;
    totalTasks?: number;
    showProgress?: boolean;
    className?: string;
}

function resolveStatus(activeTasks: number, status?: WorkloadStatus): WorkloadStatus {
    if (status) return status;
    if (activeTasks < 5) return 'GREEN';
    if (activeTasks <= 10) return 'YELLOW';
    return 'RED';
}

const statusConfig: Record<WorkloadStatus, { label: string; short: string; dot: string; chip: string; bar: string }> = {
    GREEN: {
        label: 'Низкая загруженность',
        short: 'GREEN',
        dot: 'bg-emerald-500',
        chip: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        bar: 'bg-emerald-500',
    },
    YELLOW: {
        label: 'Средняя загруженность',
        short: 'YELLOW',
        dot: 'bg-amber-500',
        chip: 'bg-amber-50 text-amber-700 border border-amber-200',
        bar: 'bg-amber-500',
    },
    RED: {
        label: 'Высокая загруженность',
        short: 'RED',
        dot: 'bg-red-500',
        chip: 'bg-red-50 text-red-700 border border-red-200',
        bar: 'bg-red-500',
    },
};

export function WorkloadIndicator({
    activeTasks,
    status,
    compact = false,
    totalTasks,
    showProgress = false,
    className,
}: WorkloadIndicatorProps) {
    const value = resolveStatus(activeTasks, status);
    const cfg = statusConfig[value];

    const progress = (() => {
        if (typeof totalTasks === 'number' && totalTasks > 0) {
            return Math.min(100, Math.round((activeTasks / totalTasks) * 100));
        }
        return Math.min(100, Math.round((activeTasks / 12) * 100));
    })();

    if (compact) {
        return (
            <div className={cn('inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.chip, className)}>
                <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                <span>{cfg.short}</span>
                <span className="opacity-80">•</span>
                <span>{activeTasks}</span>
            </div>
        );
    }

    return (
        <div className={cn('w-full rounded-lg border p-2.5', cfg.chip, className)}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
                    <span className="text-xs font-semibold">{cfg.label}</span>
                </div>
                <span className="text-xs font-bold">Active: {activeTasks}</span>
            </div>

            {showProgress && (
                <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/70">
                        <div
                            className={cn('h-full rounded-full transition-all duration-300', cfg.bar)}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[10px] text-current/80">Текущая нагрузка: {progress}%</p>
                </div>
            )}
        </div>
    );
}
