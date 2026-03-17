import { useLocation, useNavigate } from 'react-router-dom';
import { EmployeeWorkload } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkloadIndicator } from '@/components/WorkloadIndicator';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmployeeCardProps {
    employee: EmployeeWorkload;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const initials = employee.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase())
        .join('');

    const statusTone = employee.workloadStatus;

    return (
        <Card
            className={cn(
                'group h-full w-full cursor-pointer rounded-xl border bg-card shadow-[0_8px_20px_-18px_rgba(2,6,23,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-18px_rgba(2,6,23,0.35)]',
                statusTone === 'RED' && 'border-red-200/70',
                statusTone === 'YELLOW' && 'border-amber-200/70',
                statusTone === 'GREEN' && 'border-emerald-200/70',
            )}
            onClick={() => navigate(`/employees/${employee.id}`, { state: { fromSearch: location.search } })}
        >
            <CardHeader className="space-y-2.5 pb-1.5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-bold text-white shadow-sm shadow-violet-300/60">
                            {initials || 'MM'}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                            <CardTitle className="truncate text-sm font-bold leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                                {employee.name}
                            </CardTitle>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                <Badge className="border-0 bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600 hover:bg-indigo-100">
                                    {employee.position || '—'}
                                </Badge>
                                <Badge variant="outline" className="border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600">
                                    {employee.department || '—'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md p-1 text-slate-400 transition-colors group-hover:text-primary">
                        <ArrowUpRight className="h-4 w-4" />
                    </div>
                </div>

                <WorkloadIndicator
                    activeTasks={employee.activeTasks}
                    totalTasks={employee.totalTasks}
                    status={employee.workloadStatus}
                    showProgress
                />
            </CardHeader>

            <CardContent className="pb-3 pt-1.5">
                <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2 text-center">
                    <div>
                        <p className="text-[22px] font-bold leading-none text-indigo-500">{employee.activeTasks}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Активные</p>
                    </div>
                    <div>
                        <p className="text-[22px] font-bold leading-none text-emerald-500">{employee.completedTasks}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Готово</p>
                    </div>
                    <div>
                        <p className={cn('text-[22px] font-bold leading-none', employee.overdueTasks > 0 ? 'text-red-500' : 'text-slate-600')}>
                            {employee.overdueTasks}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Просрочено</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
