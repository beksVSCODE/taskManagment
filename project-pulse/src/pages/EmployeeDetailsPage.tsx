import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEmployeeWorkloadDetails } from '@/hooks/useData';
import { usePermissions } from '@/hooks/usePermissions';
import { WorkloadIndicator } from '@/components/WorkloadIndicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { ArrowLeft, Loader2, ShieldAlert, Briefcase, ListTodo, Clock3, CheckCircle2, AlertTriangle, UserRound, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const COLORS = ['#3B82F6', '#22C55E', '#EF4444'];

function formatDeadline(date?: string) {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('ru-RU');
}

function getPriorityBadge(priority: string) {
    const normalized = priority?.toUpperCase?.() ?? '';

    switch (normalized) {
        case 'HIGH':
            return 'bg-red-50 text-red-700 border-red-200';
        case 'LOW':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200';
    }
}

function getPriorityLabel(priority?: string) {
    const normalized = priority?.toUpperCase?.() ?? '';
    switch (normalized) {
        case 'HIGH':
            return 'Высокий';
        case 'LOW':
            return 'Низкий';
        case 'MEDIUM':
            return 'Средний';
        default:
            return priority || '—';
    }
}

function getStatusBadge(status: string) {
    const normalized = status?.toUpperCase?.() ?? '';

    switch (normalized) {
        case 'DONE':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'IN_PROGRESS':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'REVIEW':
        case 'ON_REVIEW':
            return 'bg-violet-50 text-violet-700 border-violet-200';
        default:
            return 'bg-slate-50 text-slate-700 border-slate-200';
    }
}

function getStatusLabel(status?: string) {
    const normalized = status?.toUpperCase?.() ?? '';
    switch (normalized) {
        case 'NEW':
            return 'Новая';
        case 'IN_PROGRESS':
            return 'В работе';
        case 'ON_REVIEW':
        case 'REVIEW':
            return 'На проверке';
        case 'DONE':
            return 'Выполнена';
        default:
            return status || '—';
    }
}

export default function EmployeeDetailsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const permissions = usePermissions();
    const fromSearch = ((location.state as { fromSearch?: string } | null)?.fromSearch) ?? '';

    const {
        data,
        isLoading,
        isError,
        error,
    } = useEmployeeWorkloadDetails(id);

    const chartData = useMemo(() => {
        if (!data) return [];
        return [
            { name: 'Активные', value: data.taskStatusStats.active },
            { name: 'Выполненные', value: data.taskStatusStats.completed },
            { name: 'Просроченные', value: data.taskStatusStats.overdue },
        ];
    }, [data]);

    if (!permissions.canViewEmployeesWorkload) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
                <ShieldAlert className="h-8 w-8 text-destructive" />
                <h2 className="text-lg font-semibold">Нет доступа</h2>
                <p className="text-sm text-muted-foreground">Раздел доступен только ADMIN, LEADER и PM.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="space-y-3">
                <Button variant="outline" size="sm" onClick={() => navigate(`/employees${fromSearch}`)}>
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Назад
                </Button>
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                    Ошибка загрузки сотрудника: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/employees${fromSearch}`)}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> Назад
                        </Button>

                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-bold text-foreground">{data.employee.name}</h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <UserRound className="h-3.5 w-3.5" />
                                    {data.employee.position || '—'}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Building2 className="h-3.5 w-3.5" />
                                    {data.employee.department || '—'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[280px]">
                        <WorkloadIndicator
                            activeTasks={data.statistics.activeTasks}
                            totalTasks={data.statistics.totalTasks}
                            workloadPercent={data.statistics.workloadPercent}
                            status={data.statistics.workloadStatus}
                            showProgress
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard title="Всего задач" value={data.statistics.totalTasks} icon={<ListTodo className="h-4 w-4" />} />
                <StatCard title="Активные" value={data.statistics.activeTasks} icon={<Clock3 className="h-4 w-4" />} />
                <StatCard title="Выполненные" value={data.statistics.completedTasks} icon={<CheckCircle2 className="h-4 w-4" />} />
                <StatCard title="Просроченные" value={data.statistics.overdueTasks} icon={<AlertTriangle className="h-4 w-4" />} danger={data.statistics.overdueTasks > 0} />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
                <Card className="order-2 border-border/70 shadow-sm xl:order-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Задачи сотрудника</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.tasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Задачи отсутствуют</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Задача</TableHead>
                                        <TableHead>Проект</TableHead>
                                        <TableHead>Приоритет</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Дедлайн</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.tasks.map(task => (
                                        <TableRow
                                            key={task.id}
                                            className={cn(
                                                'transition-colors hover:bg-muted/40',
                                                task.isOverdue && 'bg-red-50/60 hover:bg-red-50'
                                            )}
                                        >
                                            <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                                            <TableCell>{task.project || '—'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('font-medium', getPriorityBadge(task.priority))}>
                                                    {getPriorityLabel(task.priority)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn('font-medium', getStatusBadge(task.status))}>
                                                    {getStatusLabel(task.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={task.isOverdue ? 'font-semibold text-red-600' : ''}>
                                                {formatDeadline(task.deadline)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                <div className="order-1 space-y-4 xl:order-2">
                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Статистика задач</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mx-auto h-56 w-full max-w-[260px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={78}
                                            innerRadius={46}
                                            paddingAngle={3}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend iconType="circle" iconSize={8} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/70 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Проекты сотрудника</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Проекты не найдены</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {data.projects.map(project => (
                                        <Badge
                                            key={project.id}
                                            variant="outline"
                                            className="gap-1.5 rounded-full border-border/70 bg-muted/20 px-2.5 py-1 font-medium text-foreground"
                                        >
                                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                            {project.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon,
    danger = false,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <Card className="border-border/70 shadow-sm transition-all hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground">{title}</p>
                    <p className={`text-2xl font-bold ${danger ? 'text-red-600' : 'text-foreground'}`}>{value}</p>
                </div>
                <div className={`rounded-xl p-2.5 ${danger ? 'bg-red-100 text-red-600' : 'bg-muted text-foreground'}`}>
                    {icon}
                </div>
            </CardContent>
        </Card>
    );
}
