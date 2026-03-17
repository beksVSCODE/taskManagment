import { Task, TaskStatus, Subtask, Comment } from '@/types';
import { api } from './apiClient';

// Маппер TaskResponse → Task
function mapTask(t: Record<string, unknown>): Task {
    return {
        id: String(t.id),
        projectId: String(t.projectId),
        projectName: t.projectName as string | undefined,
        title: t.title as string,
        description: (t.description as string) || '',
        status: t.status as TaskStatus,
        priority: t.priority as Task['priority'],
        creatorId: t.creatorId ? String(t.creatorId) : '',
        creatorName: t.creatorName as string | undefined,
        pmId: t.pmId ? String(t.pmId) : undefined,
        pmName: t.pmName as string | undefined,
        assigneeIds: ((t.assigneeIds as number[]) || []).map(String),
        assigneeNames: t.assigneeNames as string[] | undefined,
        watcherIds: [],
        startDate: t.startDate as string | undefined,
        dueDate: (t.dueDate as string) || '',
        createdAt: (t.createdAt as string) || new Date().toISOString(),
        completedAt: t.completedAt as string | undefined,
        isOverdue: t.isOverdue as boolean | undefined,
        tags: [],
        tagNames: (t.tagNames as string[]) || [],
        subtasks: [],
        subtaskCount: (t.subtaskCount as number) || 0,
        completedSubtaskCount: (t.completedSubtaskCount as number) || 0,
        comments: [],
        attachments: [],
        auditLog: [],
    };
}

// Маппер SubtaskResponse → Subtask
function mapSubtask(s: Record<string, unknown>): Subtask {
    return {
        id: String(s.id),
        title: s.title as string,
        assigneeId: s.assigneeId ? String(s.assigneeId) : undefined,
        assigneeName: s.assigneeName as string | undefined,
        status: (s.status as string) === 'DONE' ? 'DONE' : 'NEW',
        dueDate: s.dueDate as string | undefined,
    };
}

// Маппер CommentResponse → Comment
function mapComment(c: Record<string, unknown>): Comment {
    return {
        id: String(c.id),
        taskId: String(c.taskId),
        authorId: String(c.authorId),
        authorName: c.authorName as string | undefined,
        text: (c.content as string) || '',
        createdAt: (c.createdAt as string) || new Date().toISOString(),
        attachments: [],
    };
}

export const taskService = {
    getAll: async (): Promise<Task[]> => {
        const data = await api.get<Record<string, unknown>[]>('/tasks');
        return data.map(mapTask);
    },

    getByProject: async (projectId: string): Promise<Task[]> => {
        const data = await api.get<Record<string, unknown>[]>('/tasks');
        return data.filter(t => String(t.projectId) === projectId).map(mapTask);
    },

    getById: async (id: string): Promise<Task | undefined> => {
        try {
            const data = await api.get<Record<string, unknown>>(`/tasks/${id}`);
            const task = mapTask(data);
            // Загружаем подзадачи и комментарии
            const [subtasks, comments] = await Promise.all([
                api.get<Record<string, unknown>[]>(`/tasks/${id}/subtasks`).catch(() => []),
                api.get<Record<string, unknown>[]>(`/tasks/${id}/comments`).catch(() => []),
            ]);
            task.subtasks = subtasks.map(mapSubtask);
            task.comments = comments.map(mapComment);
            return task;
        } catch {
            return undefined;
        }
    },

    getSubtasks: async (taskId: string): Promise<Subtask[]> => {
        const data = await api.get<Record<string, unknown>[]>(`/tasks/${taskId}/subtasks`);
        return data.map(mapSubtask);
    },

    create: async (taskData: Omit<Task, 'id' | 'createdAt' | 'auditLog'>): Promise<Task> => {
        const body = {
            title: taskData.title,
            description: taskData.description,
            projectId: Number(taskData.projectId),
            priority: taskData.priority,
            status: taskData.status,
            startDate: taskData.startDate,
            dueDate: taskData.dueDate,
            assigneeIds: taskData.assigneeIds.map(Number),
        };
        const result = await api.post<Record<string, unknown>>('/tasks', body);
        return mapTask(result);
    },

    update: async (id: string, updates: Partial<Task>, _userId?: string): Promise<Task> => {
        const body: Record<string, unknown> = {};
        if (updates.title !== undefined) body.title = updates.title;
        if (updates.description !== undefined) body.description = updates.description;
        if (updates.priority !== undefined) body.priority = updates.priority;
        if (updates.status !== undefined) body.status = updates.status;
        if (updates.startDate !== undefined) body.startDate = updates.startDate;
        if (updates.dueDate !== undefined) body.dueDate = updates.dueDate;
        if (updates.assigneeIds !== undefined) body.assigneeIds = updates.assigneeIds.map(Number);
        const result = await api.patch<Record<string, unknown>>(`/tasks/${id}`, body);
        return mapTask(result);
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/tasks/${id}`);
    },

    // ── Подзадачи ─────────────────────────────────────────────────────────────

    addSubtask: async (taskId: string, subtaskData: Omit<Subtask, 'id'>, _userId?: string): Promise<Task> => {
        await api.post(`/tasks/${taskId}/subtasks`, {
            title: subtaskData.title,
            assigneeId: subtaskData.assigneeId ? Number(subtaskData.assigneeId) : undefined,
            dueDate: subtaskData.dueDate,
        });
        const task = await taskService.getById(taskId);
        if (!task) throw new Error('Task not found');
        return task;
    },

    updateSubtask: async (taskId: string, subtaskId: string, updates: Partial<Subtask>, _userId?: string): Promise<Task> => {
        if (updates.status !== undefined) {
            await api.patch(`/subtasks/${subtaskId}/status`, { status: updates.status });
        } else {
            const body: Record<string, unknown> = {};
            if (updates.title !== undefined) body.title = updates.title;
            if (updates.assigneeId !== undefined) body.assigneeId = Number(updates.assigneeId);
            if (updates.dueDate !== undefined) body.dueDate = updates.dueDate;
            await api.patch(`/subtasks/${subtaskId}`, body);
        }
        const task = await taskService.getById(taskId);
        if (!task) throw new Error('Task not found');
        return task;
    },

    deleteSubtask: async (taskId: string, subtaskId: string, _userId?: string): Promise<Task> => {
        await api.delete(`/subtasks/${subtaskId}`);
        const task = await taskService.getById(taskId);
        if (!task) throw new Error('Task not found');
        return task;
    },

    // ── Комментарии ───────────────────────────────────────────────────────────

    // Получить комментарии задачи напрямую (без full getById)
    getComments: async (taskId: string): Promise<Comment[]> => {
        const data = await api.get<Record<string, unknown>[]>(`/tasks/${taskId}/comments`);
        return data.map(mapComment);
    },

    addComment: async (taskId: string, _authorId: string, text: string): Promise<void> => {
        await api.post(`/tasks/${taskId}/comments`, { content: text });
    },
};
