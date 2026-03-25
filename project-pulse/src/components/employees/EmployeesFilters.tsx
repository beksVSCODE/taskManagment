import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { WorkloadStatus } from '@/types';

interface Option {
    id: string;
    label: string;
}

interface EmployeesFiltersProps {
    search: string;
    department: string;
    project: string;
    workloadStatus: 'ALL' | WorkloadStatus;
    showWithoutTasks: boolean;
    showOnlyOverdue: boolean;
    departmentOptions: Option[];
    projectOptions: Option[];
    onSearchChange: (value: string) => void;
    onDepartmentChange: (value: string) => void;
    onProjectChange: (value: string) => void;
    onWorkloadStatusChange: (value: 'ALL' | WorkloadStatus) => void;
    onShowWithoutTasksChange: (value: boolean) => void;
    onShowOnlyOverdueChange: (value: boolean) => void;
    onReset: () => void;
}

export function EmployeesFilters({
    search,
    department,
    project,
    workloadStatus,
    showWithoutTasks,
    showOnlyOverdue,
    departmentOptions,
    projectOptions,
    onSearchChange,
    onDepartmentChange,
    onProjectChange,
    onWorkloadStatusChange,
    onShowWithoutTasksChange,
    onShowOnlyOverdueChange,
    onReset,
}: EmployeesFiltersProps) {
    return (
        <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Input
                    value={search}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Поиск по имени"
                    className="h-9"
                />

                <Select value={department} onValueChange={onDepartmentChange}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder="Все отделы" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Все отделы</SelectItem>
                        {departmentOptions.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={project} onValueChange={onProjectChange}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder="Все проекты" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Все проекты</SelectItem>
                        {projectOptions.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={workloadStatus} onValueChange={v => onWorkloadStatusChange(v as 'ALL' | WorkloadStatus)}>
                    <SelectTrigger className="h-9">
                        <SelectValue placeholder="Все статусы" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Все статусы</SelectItem>
                        <SelectItem value="GREEN">Низкая</SelectItem>
                        <SelectItem value="YELLOW">Средняя</SelectItem>
                        <SelectItem value="RED">Высокая</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={showWithoutTasks}
                        onCheckedChange={v => onShowWithoutTasksChange(Boolean(v))}
                    />
                    <span>Показать только сотрудников без задач</span>
                </label>

                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={showOnlyOverdue}
                        onCheckedChange={v => onShowOnlyOverdueChange(Boolean(v))}
                    />
                    <span>Только с просроченными задачами</span>
                </label>

                <Button variant="outline" size="sm" onClick={onReset} className="w-full xs:w-auto">Сбросить фильтры</Button>
                <Label className="w-full sm:ml-auto sm:w-auto text-xs text-muted-foreground">Фильтры применяются мгновенно</Label>
            </div>
        </div>
    );
}
