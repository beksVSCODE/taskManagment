import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { notificationService } from '@/services/notificationService';
import { departmentService } from '@/services/departmentService';
import { employeeWorkloadService } from '@/services/employeeWorkloadService';
import { voiceTaskService } from '@/services/voiceTaskService';
import { Task, Role, Subtask, Project, Comment } from '@/types';

export function useProjects() {
    return useQuery({ queryKey: ['projects'], queryFn: projectService.getAll });
}

export function useProject(id: string) {
    return useQuery({ queryKey: ['project', id], queryFn: () => projectService.getById(id) });
}

export function useTasks(projectId: string) {
    return useQuery({ queryKey: ['tasks', projectId], queryFn: () => taskService.getByProject(projectId) });
}

export function useAllTasks() {
    return useQuery({ queryKey: ['tasks', 'all'], queryFn: taskService.getAll });
}

export function useUsers() {
    return useQuery({ queryKey: ['users'], queryFn: userService.getAll });
}

// Для страницы администрирования: все пользователи включая неактивных
export function useAdminUsers() {
    return useQuery({ queryKey: ['adminUsers'], queryFn: userService.getAllAdmin });
}

export function useDepartments() {
    return useQuery({ queryKey: ['departments'], queryFn: departmentService.getAll });
}

export function useEmployeesWorkload() {
    return useQuery({ queryKey: ['employees', 'workload'], queryFn: employeeWorkloadService.getAll });
}

export function useEmployeeWorkloadDetails(id?: string) {
    return useQuery({
        queryKey: ['employees', 'workload', id],
        queryFn: () => employeeWorkloadService.getById(id as string),
        enabled: !!id,
    });
}

export function useCreateDepartment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (name: string) => departmentService.create(name),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    });
}

export function useUpdateDepartment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: { name?: string; managerId?: number } }) =>
            departmentService.update(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    });
}

export function useDeleteDepartment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => departmentService.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['departments'] }),
    });
}

export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationService.getByUser(),
        refetchInterval: 30000,
    });
}

export function useCreateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (taskData: Omit<Task, 'id' | 'createdAt' | 'auditLog'>) => taskService.create(taskData),
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useUpdateTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
            taskService.update(id, updates),

        // ─── Optimistic update ───────────────────────────────────────────────
        // Вызывается СИНХРОННО до отправки запроса.
        // Немедленно обновляет кеш → карточка прыгает в новую колонку без ожидания сервера.
        onMutate: async ({ id, updates }) => {
            // Отменяем все активные рефетчи задач, чтобы они не перезатёрли наш optimistic update
            await qc.cancelQueries({ queryKey: ['tasks'] });

            // Снапшот всех задач-кешей — для отката при ошибке
            const snapshot = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });

            // Применяем изменение во всех кешах с задачами (['tasks', projectId] и ['tasks', 'all'])
            qc.setQueriesData<Task[]>({ queryKey: ['tasks'] }, (old) =>
                old?.map(t => (t.id === id ? { ...t, ...updates } : t))
            );

            return { snapshot };
        },

        // ─── Rollback ────────────────────────────────────────────────────────
        // Восстанавливаем кеш из снапшота, если backend вернул ошибку
        onError: (_err, _vars, context) => {
            context?.snapshot.forEach(([queryKey, data]) => {
                qc.setQueryData(queryKey, data);
            });
        },

        // ─── Server sync ─────────────────────────────────────────────────────
        // После успешного ответа инвалидируем кеш, чтобы получить актуальные данные
        // (completedAt, isOverdue и др. поля, которые backend пересчитывает)
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useDeleteTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: taskService.delete,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['tasks'] });
        },
    });
}

// Загрузка комментариев задачи через отдельный ендпоинт
// Решает проблему с comments:[] хардкодом в mapTask
export function useComments(taskId: string) {
    return useQuery({
        queryKey: ['comments', taskId],
        queryFn: () => taskService.getComments(taskId),
        enabled: !!taskId,
    });
}

export function useSubtasks(taskId: string) {
    return useQuery({
        queryKey: ['subtasks', taskId],
        queryFn: () => taskService.getSubtasks(taskId),
        enabled: !!taskId,
    });
}

export function useAddComment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, authorId, text }: { taskId: string; authorId: string; text: string }) =>
            taskService.addComment(taskId, authorId, text),
        onMutate: async ({ taskId, authorId, text }) => {
            // Отменяем текущие запросы на получение комментариев, чтобы не затереть оптимистичное обновление
            await qc.cancelQueries({ queryKey: ['comments', taskId] });
            // Сохраняем снимок текущего состояния для возможного отката
            const previousComments = qc.getQueryData<Comment[]>(['comments', taskId]);
            // Добавляем оптимистичный комментарий с временным ID
            const optimisticComment: Comment = {
                id: `temp-${Date.now()}`,
                taskId,
                authorId,
                text,
                createdAt: new Date().toISOString(),
                attachments: [],
            };
            qc.setQueryData<Comment[]>(['comments', taskId], (old) => [
                ...(old ?? []),
                optimisticComment,
            ]);
            return { previousComments, taskId };
        },
        onError: (_err, _vars, context) => {
            // Откатываем оптимистичное обновление при ошибке сервера
            if (context) {
                qc.setQueryData(['comments', context.taskId], context.previousComments);
            }
        },
        onSuccess: (newComment, variables) => {
            // Заменяем временный комментарий реальным из ответа сервера (без лишнего GET-запроса)
            qc.setQueryData<Comment[]>(['comments', variables.taskId], (old) =>
                (old ?? []).map((c) => (c.id.startsWith('temp-') ? newComment : c))
            );
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useUpdateUserRole() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: Role }) => userService.updateRole(id, role),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['adminUsers'] });
        },
    });
}

export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: import('@/services/userService').CreateUserPayload) =>
            userService.create(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['adminUsers'] });
        },
    });
}

export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: import('@/services/userService').UpdateUserPayload }) =>
            userService.update(id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['adminUsers'] });
        },
    });
}

export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => userService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['users'] });
            qc.invalidateQueries({ queryKey: ['adminUsers'] });
        },
    });
}

export function useMarkNotificationRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: notificationService.markRead,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => notificationService.markAllRead(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => projectService.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Project, 'id'>) => projectService.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useUpdateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
            projectService.update(id, updates),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: ['projects'] });
            qc.invalidateQueries({ queryKey: ['project', variables.id] });
        },
    });
}

export function useAddSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskData }: { taskId: string; projectId: string; subtaskData: Omit<Subtask, 'id'> }) =>
            taskService.addSubtask(taskId, subtaskData),
        onSuccess: (_data, { taskId, projectId }) => {
            qc.invalidateQueries({ queryKey: ['subtasks', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
        },
    });
}

export function useUpdateSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: string; projectId: string; subtaskId: string; updates: Partial<Subtask> }) =>
            taskService.updateSubtask(taskId, subtaskId, updates),
        onSuccess: (_data, { taskId, projectId }) => {
            qc.invalidateQueries({ queryKey: ['subtasks', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useDeleteSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: string; projectId: string; subtaskId: string }) =>
            taskService.deleteSubtask(taskId, subtaskId),
        onSuccess: (_data, { taskId, projectId }) => {
            qc.invalidateQueries({ queryKey: ['subtasks', taskId] });
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
        },
    });
}

export function useAddProjectMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
            projectService.addMember(projectId, userId),
        onSuccess: (_data, { projectId }) => {
            qc.invalidateQueries({ queryKey: ['project', projectId] });
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useRemoveProjectMember() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
            projectService.removeMember(projectId, userId),
        onSuccess: (_data, { projectId }) => {
            // Инвалидируем кеш проекта
            qc.invalidateQueries({ queryKey: ['project', projectId] });
            // Инвалидируем кеш задач этого проекта (так как там могут измениться исполнители)
            qc.invalidateQueries({ queryKey: ['tasks', projectId] });
            // Инвалидируем общий список проектов
            qc.invalidateQueries({ queryKey: ['projects'] });
            // Инвалидируем все задачи (на случай если есть в других местах)
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
        },
    });
}

export function useParseVoiceTask() {
    return useMutation({
        mutationFn: ({ projectId, audio, transcript }: { projectId: string; audio: Blob; transcript?: string }) =>
            voiceTaskService.parse(projectId, audio, transcript),
    });
}

export function useConfirmVoiceTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            projectId,
            payload,
        }: {
            projectId: string;
            payload: import('@/types').VoiceTaskConfirmPayload;
        }) => voiceTaskService.confirm(projectId, payload),
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

