import { api } from './apiClient';
import { EmployeeProject, EmployeeTask, EmployeeWorkload, EmployeeWorkloadDetails, WorkloadStatus } from '@/types';

function toWorkloadStatus(value: unknown): WorkloadStatus {
    if (value === 'ORANGE') {
        return 'RED';
    }
    if (value === 'RED' || value === 'YELLOW' || value === 'GREEN') {
        return value;
    }
    return 'GREEN';
}

function mapEmployeeWorkload(item: Record<string, unknown>): EmployeeWorkload {
    return {
        id: String(item.id),
        name: (item.name as string) || '',
        position: (item.position as string) || '',
        department: (item.department as string) || '',
        totalTasks: Number(item.totalTasks ?? 0),
        activeTasks: Number(item.activeTasks ?? 0),
        completedTasks: Number(item.completedTasks ?? 0),
        overdueTasks: Number(item.overdueTasks ?? 0),
        workloadPercent: Number(item.workloadPercent ?? 0),
        workloadStatus: toWorkloadStatus(item.workloadStatus),
    };
}

function mapEmployeeProject(item: Record<string, unknown>): EmployeeProject {
    return {
        id: String(item.id),
        name: (item.name as string) || '',
    };
}

function mapEmployeeTask(item: Record<string, unknown>): EmployeeTask {
    return {
        id: String(item.id),
        title: (item.title as string) || '',
        project: (item.project as string) || '',
        priority: (item.priority as string) || '',
        status: (item.status as string) || '',
        deadline: item.deadline as string | undefined,
        isOverdue: Boolean(item.isOverdue ?? item.overdue ?? false),
    };
}

function mapEmployeeWorkloadDetails(data: Record<string, unknown>): EmployeeWorkloadDetails {
    const employee = (data.employee as Record<string, unknown>) || {};
    const statistics = (data.statistics as Record<string, unknown>) || {};
    const taskStatusStats = (data.taskStatusStats as Record<string, unknown>) || {};

    return {
        employee: {
            id: String(employee.id ?? ''),
            name: (employee.name as string) || '',
            position: (employee.position as string) || '',
            department: (employee.department as string) || '',
            role: (employee.role as string) || '',
        },
        statistics: {
            totalTasks: Number(statistics.totalTasks ?? 0),
            activeTasks: Number(statistics.activeTasks ?? 0),
            completedTasks: Number(statistics.completedTasks ?? 0),
            overdueTasks: Number(statistics.overdueTasks ?? 0),
            workloadPercent: Number(statistics.workloadPercent ?? 0),
            workloadStatus: toWorkloadStatus(statistics.workloadStatus),
        },
        projects: ((data.projects as Record<string, unknown>[]) || []).map(mapEmployeeProject),
        taskStatusStats: {
            active: Number(taskStatusStats.active ?? 0),
            completed: Number(taskStatusStats.completed ?? 0),
            overdue: Number(taskStatusStats.overdue ?? 0),
        },
        tasks: ((data.tasks as Record<string, unknown>[]) || []).map(mapEmployeeTask),
    };
}

export const employeeWorkloadService = {
    getAll: async (): Promise<EmployeeWorkload[]> => {
        const response = await api.get<Record<string, unknown>[]>('/employees/workload');
        return response.map(mapEmployeeWorkload);
    },

    getById: async (id: string): Promise<EmployeeWorkloadDetails> => {
        const response = await api.get<Record<string, unknown>>(`/employees/${id}/workload`);
        return mapEmployeeWorkloadDetails(response);
    },
};
