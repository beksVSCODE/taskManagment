import { Department } from '@/types';
import { api } from './apiClient';

// Маппер: ответ бэкенда → тип Department фронтенда
function mapDepartment(d: Record<string, unknown>): Department {
    const mgr = d.manager as Record<string, unknown> | null | undefined;
    return {
        id: d.id as number,
        name: d.name as string,
        manager: mgr
            ? {
                id: mgr.id as number,
                fullName: (mgr.fullName as string) || '',
                email: (mgr.email as string) || '',
                role: (mgr.role as string) || '',
            }
            : undefined,
    };
}

export const departmentService = {
    /** GET /api/departments — доступно всем аутентифицированным */
    getAll: async (): Promise<Department[]> => {
        const data = await api.get<Record<string, unknown>[]>('/departments');
        return data.map(mapDepartment);
    },

    /** POST /api/admin/departments — только ADMIN */
    create: async (name: string): Promise<Department> => {
        const data = await api.post<Record<string, unknown>>('/admin/departments', { name });
        return mapDepartment(data);
    },

    /** PATCH /api/admin/departments/{id} — только ADMIN */
    update: async (
        id: number,
        payload: { name?: string; managerId?: number },
    ): Promise<Department> => {
        const body: Record<string, unknown> = {};
        if (payload.name !== undefined) body.name = payload.name;
        // AdminService ожидает { manager: { id: X } }
        if (payload.managerId !== undefined) {
            body.manager = payload.managerId ? { id: payload.managerId } : null;
        }
        const data = await api.patch<Record<string, unknown>>(
            `/admin/departments/${id}`,
            body,
        );
        return mapDepartment(data);
    },

    /** DELETE /api/admin/departments/{id} — только ADMIN */
    delete: async (id: number): Promise<void> => {
        await api.delete(`/admin/departments/${id}`);
    },
};
