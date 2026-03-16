import { useNavigate } from 'react-router-dom';
import { EmployeeWorkload } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkloadIndicator } from '@/components/WorkloadIndicator';
import { CheckCircle2, Clock3, AlertTriangle, ListTodo, ArrowUpRight, BriefcaseBusiness, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EmployeeCardProps {
    employee: EmployeeWorkload;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            className="group h-full cursor-pointer rounded-xl border border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
            onClick={() => navigate(`/employees/${employee.id}`)}
        >
            <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                            {employee.name}
                        </CardTitle>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge variant="outline" className="gap-1.5 border-border/70 bg-muted/20 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <BriefcaseBusiness className="h-3 w-3" />
                                {employee.position || '—'}
                            </Badge>
                            <Badge variant="outline" className="gap-1.5 border-border/70 bg-muted/20 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {employee.department || '—'}
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-md p-1 text-muted-foreground/50 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
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

            <CardContent className="flex h-full flex-col gap-4 pt-1">
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <StatPill
                        icon={<Clock3 className="h-3.5 w-3.5" />}
                        label="Active"
                        value={employee.activeTasks}
                        className="border border-blue-200 bg-blue-50 text-blue-700"
                    />
                    <StatPill
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        label="Done"
                        value={employee.completedTasks}
                        className="border border-emerald-200 bg-emerald-50 text-emerald-700"
                    />
                    <StatPill
                        icon={<AlertTriangle className="h-3.5 w-3.5" />}
                        label="Overdue"
                        value={employee.overdueTasks}
                        className="border border-red-200 bg-red-50 text-red-700"
                        emphatic={employee.overdueTasks > 0}
                    />
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/25 p-3.5">
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Мини-статистика
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <MiniStat
                            label="Всего"
                            value={employee.totalTasks}
                            icon={<ListTodo className="h-3.5 w-3.5" />}
                            strong
                        />
                        <MiniStat label="Активные" value={employee.activeTasks} />
                        <MiniStat label="Завершённые" value={employee.completedTasks} />
                        <MiniStat label="Просроченные" value={employee.overdueTasks} danger={employee.overdueTasks > 0} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function StatPill({
    icon,
    label,
    value,
    className,
    emphatic = false,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    className: string;
    emphatic?: boolean;
}) {
    return (
        <div className={`rounded-lg px-2 py-1.5 ${className} ${emphatic ? 'ring-1 ring-red-300/60' : ''}`}>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                    {icon}
                    <span className="font-medium">{label}</span>
                </div>
                <span className={`font-bold ${emphatic ? 'text-red-700' : ''}`}>{value}</span>
            </div>
        </div>
    );
}

function MiniStat({
    label,
    value,
    icon,
    strong = false,
    danger = false,
}: {
    label: string;
    value: number;
    icon?: React.ReactNode;
    strong?: boolean;
    danger?: boolean;
}) {
    return (
        <div className={`rounded-lg border px-2.5 py-2 ${danger ? 'border-red-200 bg-red-50/70' : 'border-border/60 bg-background/80'}`}>
            <div className="flex items-center justify-between gap-1">
                <span className={`text-[11px] ${danger ? 'text-red-700' : 'text-muted-foreground'}`}>{label}</span>
                {icon}
            </div>
            <p className={`text-sm font-semibold ${danger ? 'text-red-700' : 'text-foreground'} ${strong ? 'text-base' : ''}`}>{value}</p>
        </div>
    );
}
