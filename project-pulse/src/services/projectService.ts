import { Project } from '@/types';
import { api } from './apiClient';

// Маппер: ответ бэкенда → тип Project фронтенда
function mapProject(p: Record<string, unknown>): Project {
    return {
        id: String(p.id),
        name: p.name as string,
        description: (p.description as string) || '',
        department: (p.departmentName as string) || '',
        departmentId: p.departmentId as number | undefined,
        pmId: p.pmId ? String(p.pmId) : '',
        pmName: p.pmName as string | undefined,
        teamMemberIds: ((p.memberIds as number[]) || []).map(String),
        memberNames: p.memberNames as string[] | undefined,
        status: p.status as string | undefined,
        taskCount: p.taskCount as number | undefined,
    };
}

export const projectService = {
    getAll: async (): Promise<Project[]> => {
        const data = await api.get<Record<string, unknown>[]>('/projects');
        return data.map(mapProject);
    },

    getById: async (id: string): Promise<Project | undefined> => {
        try {
            const data = await api.get<Record<string, unknown>>(`/projects/${id}`);
            return mapProject(data);
        } catch {
            return undefined;
        }
    },

    create: async (data: Omit<Project, 'id'>): Promise<Project> => {
        const body = {
            name: data.name,
            description: data.description,
            departmentId: data.departmentId,
            pmId: data.pmId ? Number(data.pmId) : undefined,
            memberIds: data.teamMemberIds.map(Number),
        };
        const result = await api.post<Record<string, unknown>>('/projects', body);
        return mapProject(result);
    },

    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
        const body: Record<string, unknown> = {};
        if (updates.name !== undefined) body.name = updates.name;
        if (updates.description !== undefined) body.description = updates.description;
        if (updates.departmentId !== undefined) body.departmentId = updates.departmentId;
        if (updates.pmId !== undefined) body.pmId = Number(updates.pmId);
        if (updates.teamMemberIds !== undefined) body.memberIds = updates.teamMemberIds.map(Number);
        const result = await api.patch<Record<string, unknown>>(`/projects/${id}`, body);
        return mapProject(result);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/projects/${id}`);
    },
};

