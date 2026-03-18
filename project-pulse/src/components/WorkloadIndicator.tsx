import { WorkloadStatus } from '@/types';
import { cn } from '@/lib/utils';

interface WorkloadIndicatorProps {
    activeTasks: number;
    status?: WorkloadStatus;
    compact?: boolean;
    totalTasks?: number;
    workloadPercent?: number;
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
        short: 'Низкая',
        dot: 'bg-emerald-500',
        chip: 'text-emerald-700',
        bar: 'bg-emerald-500',
    },
    YELLOW: {
        label: 'Средняя загруженность',
        short: 'Средняя',
        dot: 'bg-amber-500',
        chip: 'text-amber-700',
        bar: 'bg-amber-500',
    },
    RED: {
        label: 'Высокая загруженность',
        short: 'Высокая',
        dot: 'bg-red-500',
        chip: 'text-red-700',
        bar: 'bg-red-500',
    },
};

export function WorkloadIndicator({
    activeTasks,
    status,
    compact = false,
    totalTasks,
    workloadPercent,
    showProgress = false,
    className,
}: WorkloadIndicatorProps) {
    const value = resolveStatus(activeTasks, status);
    const cfg = statusConfig[value];

    const progress = (() => {
        if (typeof workloadPercent === 'number' && Number.isFinite(workloadPercent)) {
            return Math.max(0, Math.min(100, Math.round(workloadPercent)));
        }
        if (typeof totalTasks === 'number' && totalTasks > 0) {
            return Math.min(100, Math.round((activeTasks / totalTasks) * 100));
        }
        return Math.min(100, Math.round((activeTasks / 12) * 100));
    })();

    if (compact) {
        return (
            <div className={cn('inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] font-semibold', cfg.chip, className)}>
                <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                <span>{cfg.short}</span>
                <span className="opacity-80">•</span>
                <span>{activeTasks}</span>
            </div>
        );
    }

    return (
        <div className={cn('w-full rounded-lg border border-border/70 bg-muted/15 px-2.5 py-2', className)}>
            <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                    <span className={cn('text-[11px] font-medium', cfg.chip)}>{cfg.label}</span>
                </div>
                <span className={cn('text-lg font-bold leading-none', cfg.chip)}>{progress}%</span>
            </div>

            <div className={cn('mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-200/80', !showProgress && 'mt-1')}>
                <div
                    className={cn('h-full rounded-full transition-all duration-300', cfg.bar)}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
