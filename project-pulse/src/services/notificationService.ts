import { AppNotification, NotificationType } from '@/types';
import { api } from './apiClient';

function mapNotification(n: Record<string, unknown>): AppNotification {
    return {
        id: String(n.id),
        userId: '',          // бэкенд не возвращает userId — текущий пользователь
        type: (n.type as NotificationType),
        message: n.message as string,
        taskId: n.taskId ? String(n.taskId) : undefined,
        taskTitle: n.taskTitle as string | undefined,
        read: !!(n.isRead ?? n.read),
        createdAt: (n.createdAt as string) || new Date().toISOString(),
    };
}

export const notificationService = {
    getByUser: async (_userId?: string): Promise<AppNotification[]> => {
        const data = await api.get<Record<string, unknown>[]>('/notifications');
        return data.map(mapNotification);
    },

    getUnread: async (): Promise<AppNotification[]> => {
        const data = await api.get<Record<string, unknown>[]>('/notifications/unread');
        return data.map(mapNotification);
    },

    countUnread: async (): Promise<number> => {
        const data = await api.get<{ count: number }>('/notifications/count');
        return data.count;
    },

    markRead: async (id: string): Promise<void> => {
        await api.patch(`/notifications/${id}/read`);
    },

    markAllRead: async (_userId?: string): Promise<void> => {
        await api.patch('/notifications/read-all');
    },
};

