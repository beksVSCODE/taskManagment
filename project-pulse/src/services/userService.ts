import { User, Role } from '@/types';
import { api } from './apiClient';

function mapUser(u: Record<string, unknown>): User {
    return {
        id: String(u.id),
        name: (u.fullName as string) || (u.name as string) || '',
        email: u.email as string,
        role: (u.role as Role),
        department: (u.departmentName as string) ||
            ((u.department as Record<string, unknown>)?.name as string) || '',
        departmentId: (u.departmentId as number) ??
            ((u.department as Record<string, unknown>)?.id as number) ?? undefined,
        active: (u.active as boolean) ?? true,
    };
}

export interface CreateUserPayload {
    fullName: string;
    email: string;
    password: string;
    role: Role;
    departmentId?: number;
}

export interface UpdateUserPayload {
    fullName?: string;
    role?: Role;
    departmentId?: number | null;
    clearDepartment?: boolean;
    active?: boolean;
}

export const userService = {
    getAll: async (): Promise<User[]> => {
        const data = await api.get<Record<string, unknown>[]>('/users');
        return data.map(mapUser);
    },

    // ADMIN only — все пользователи (включая неактивных) с полем active
    getAllAdmin: async (): Promise<User[]> => {
        const data = await api.get<Record<string, unknown>[]>('/admin/users');
        return data.map(mapUser);
    },

    getById: async (id: string): Promise<User | undefined> => {
        try {
            const data = await api.get<Record<string, unknown>>(`/users/${id}`);
            return mapUser(data);
        } catch {
            return undefined;
        }
    },

    // ADMIN only
    create: async (payload: CreateUserPayload): Promise<User> => {
        const data = await api.post<Record<string, unknown>>('/admin/users', payload);
        return mapUser(data);
    },

    // ADMIN only
    update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
        const data = await api.patch<Record<string, unknown>>(`/admin/users/${id}`, payload);
        return mapUser(data);
    },

    // ADMIN only — сменить роль отдельно
    updateRole: async (id: string, role: Role): Promise<User> => {
        const data = await api.patch<Record<string, unknown>>(`/admin/users/${id}`, { role });
        return mapUser(data);
    },

    // ADMIN only
    delete: async (id: string): Promise<void> => {
        await api.delete(`/admin/users/${id}`);
    },
};

