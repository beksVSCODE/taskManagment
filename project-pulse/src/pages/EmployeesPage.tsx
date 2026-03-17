import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAllTasks, useEmployeesWorkload, useProjects } from '@/hooks/useData';
import { EmployeeCard } from '@/components/EmployeeCard';
import { usePermissions } from '@/hooks/usePermissions';
import { Users, ShieldAlert } from 'lucide-react';
import { EmployeesFilters } from '@/components/employees/EmployeesFilters';
import { EmployeesGridSkeleton } from '@/components/employees/EmployeesGridSkeleton';
import { EmployeesEmptyState } from '@/components/employees/EmployeesEmptyState';
import { EmployeesErrorState } from '@/components/employees/EmployeesErrorState';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { WorkloadStatus } from '@/types';

const PAGE_SIZE = 9;

export default function EmployeesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const permissions = usePermissions();
    const {
        data: employees = [],
        isLoading,
        isError,
        error,
        refetch,
    } = useEmployeesWorkload();
    const { data: projects = [] } = useProjects();
    const { data: allTasks = [] } = useAllTasks();

    const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
    const [department, setDepartment] = useState(() => searchParams.get('department') ?? 'ALL');
    const [project, setProject] = useState(() => searchParams.get('project') ?? 'ALL');
    const [workloadStatus, setWorkloadStatus] = useState<'ALL' | WorkloadStatus>(() => {
        const status = searchParams.get('workloadStatus');
        return status === 'GREEN' || status === 'YELLOW' || status === 'RED' ? status : 'ALL';
    });
    const [showWithoutTasks, setShowWithoutTasks] = useState(() => searchParams.get('withoutTasks') !== '0');
    const [showOnlyOverdue, setShowOnlyOverdue] = useState(() => searchParams.get('onlyOverdue') === '1');
    const [page, setPage] = useState(() => {
        const value = Number(searchParams.get('page') ?? '1');
        return Number.isFinite(value) && value > 0 ? value : 1;
    });

    useEffect(() => {
        const next = new URLSearchParams();

        if (search.trim()) next.set('q', search.trim());
        if (department !== 'ALL') next.set('department', department);
        if (project !== 'ALL') next.set('project', project);
        if (workloadStatus !== 'ALL') next.set('workloadStatus', workloadStatus);
        if (!showWithoutTasks) next.set('withoutTasks', '0');
        if (showOnlyOverdue) next.set('onlyOverdue', '1');
        if (page > 1) next.set('page', String(page));

        if (next.toString() !== searchParams.toString()) {
            setSearchParams(next, { replace: true });
        }
    }, [
        search,
        department,
        project,
        workloadStatus,
        showWithoutTasks,
        showOnlyOverdue,
        page,
        searchParams,
        setSearchParams,
    ]);

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
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">Сотрудники</h1>
                        <p className="text-sm text-muted-foreground">Загруженность команды</p>
                    </div>
                </div>
                <EmployeesGridSkeleton />
            </div>
        );
    }

    if (isError) {
        return (
            <EmployeesErrorState
                message={error instanceof Error ? error.message : 'Неизвестная ошибка'}
                onRetry={() => refetch()}
            />
        );
    }

    const visibleProjects = projects.filter(p => permissions.canViewProject(p));

    const projectOptions = visibleProjects
        .map(p => {
            const assigneeIds = Array.from(
                new Set(
                    allTasks
                        .filter(t => t.projectId === p.id)
                        .flatMap(t => t.assigneeIds ?? []),
                ),
            );

            return {
                id: p.id,
                label: p.name,
                pmId: p.pmId,
                memberIds: p.teamMemberIds ?? [],
                assigneeIds,
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

    const departmentOptions = Array.from(
        new Set(employees.map(e => e.department).filter(Boolean)),
    )
        .map(dept => ({ id: dept, label: dept }))
        .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

    const filteredEmployees = (() => {
        const q = search.trim().toLowerCase();

        return employees.filter(employee => {
            if (q && !employee.name.toLowerCase().includes(q)) {
                return false;
            }

            if (department !== 'ALL' && employee.department !== department) {
                return false;
            }

            if (project !== 'ALL') {
                const selectedProject = projectOptions.find(p => p.id === project);
                if (!selectedProject) {
                    return false;
                }
                const isPm = selectedProject.pmId === employee.id;
                const isMember = selectedProject.memberIds.includes(employee.id);
                const isAssignee = selectedProject.assigneeIds.includes(employee.id);
                if (!isPm && !isMember && !isAssignee) {
                    return false;
                }
            }

            if (workloadStatus !== 'ALL' && employee.workloadStatus !== workloadStatus) {
                return false;
            }

            if (!showWithoutTasks && employee.totalTasks === 0) {
                return false;
            }

            if (showOnlyOverdue && employee.overdueTasks <= 0) {
                return false;
            }

            return true;
        });
    })();

    const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const pagedEmployees = filteredEmployees.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const resetFilters = () => {
        setSearch('');
        setDepartment('ALL');
        setProject('ALL');
        setWorkloadStatus('ALL');
        setShowWithoutTasks(true);
        setShowOnlyOverdue(false);
        setPage(1);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-foreground">Сотрудники</h1>
                    <p className="text-sm text-muted-foreground">
                        Загруженность команды: {filteredEmployees.length} из {employees.length} сотрудников
                    </p>
                </div>
            </div>

            <EmployeesFilters
                search={search}
                department={department}
                project={project}
                workloadStatus={workloadStatus}
                showWithoutTasks={showWithoutTasks}
                showOnlyOverdue={showOnlyOverdue}
                departmentOptions={departmentOptions}
                projectOptions={projectOptions.map(p => ({ id: p.id, label: p.label }))}
                onSearchChange={value => {
                    setSearch(value);
                    setPage(1);
                }}
                onDepartmentChange={value => {
                    setDepartment(value);
                    setPage(1);
                }}
                onProjectChange={value => {
                    setProject(value);
                    setPage(1);
                }}
                onWorkloadStatusChange={value => {
                    setWorkloadStatus(value);
                    setPage(1);
                }}
                onShowWithoutTasksChange={value => {
                    setShowWithoutTasks(value);
                    setPage(1);
                }}
                onShowOnlyOverdueChange={value => {
                    setShowOnlyOverdue(value);
                    setPage(1);
                }}
                onReset={resetFilters}
            />

            {filteredEmployees.length === 0 ? (
                <EmployeesEmptyState
                    title="Сотрудники не найдены"
                    description="Измените параметры поиска и фильтров или сбросьте их."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {pagedEmployees.map(employee => (
                            <EmployeeCard key={employee.id} employee={employee} />
                        ))}
                    </div>
                    <EmployeesPagination page={safePage} totalPages={totalPages} onChange={setPage} />
                </>
            )}
        </div>
    );
}
