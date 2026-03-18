import { AppNotification, NotificationType } from '@/types';
import { api } from './apiClient';

function localizeNotificationMessage(message: string): string {
    const replacements: Array<[RegExp, string]> = [
        [/\bIN_PROGRESS\b/gi, 'В работе'],
        [/\bON_REVIEW\b/gi, 'На проверке'],
        [/\bREVIEW\b/gi, 'На проверке'],
        [/\bDONE\b/gi, 'Выполнено'],
        [/\bNEW\b/gi, 'Новая'],
        [/\bHIGH\b/gi, 'Высокий'],
        [/\bMEDIUM\b/gi, 'Средний'],
        [/\bLOW\b/gi, 'Низкий'],
        [/\bin progress\b/gi, 'в работе'],
        [/\bon review\b/gi, 'на проверке'],
        [/\bdone\b/gi, 'выполнено'],
        [/\bnew\b/gi, 'новая'],
        [/\bhigh\b/gi, 'высокий'],
        [/\bmedium\b/gi, 'средний'],
        [/\blow\b/gi, 'низкий'],
    ];

    return replacements.reduce((acc, [pattern, value]) => acc.replace(pattern, value), message);
}

function mapNotification(n: Record<string, unknown>): AppNotification {
    const rawMessage = (n.message as string) || '';

    return {
        id: String(n.id),
        userId: '',          // бэкенд не возвращает userId — текущий пользователь
        type: (n.type as NotificationType),
        message: localizeNotificationMessage(rawMessage),
        taskId: n.taskId ? String(n.taskId) : undefined,
        taskTitle: n.taskTitle as string | undefined,
        projectId: n.projectId ? String(n.projectId) : undefined,
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

