import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/projectService';
import { taskService } from '@/services/taskService';
import { userService } from '@/services/userService';
import { notificationService } from '@/services/notificationService';
import { departmentService } from '@/services/departmentService';
import { employeeWorkloadService } from '@/services/employeeWorkloadService';
import { Task, Role, Subtask, Project } from '@/types';

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
// Решает проблему с comments:[] хардкодом в mapTask
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
        // variables содержит taskId — инвалидируем только комментарии этой задачи
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ['comments', variables.taskId] });
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useAddSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskData }: { taskId: string; subtaskData: Omit<Subtask, 'id'> }) =>
            taskService.addSubtask(taskId, subtaskData),
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['subtasks', task.id] });
        },
    });
}

export function useUpdateSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskId, updates }: { taskId: string; subtaskId: string; updates: Partial<Subtask> }) =>
            taskService.updateSubtask(taskId, subtaskId, updates),
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['subtasks', task.id] });
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useDeleteSubtask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ taskId, subtaskId }: { taskId: string; subtaskId: string }) =>
            taskService.deleteSubtask(taskId, subtaskId),
        onSuccess: (task) => {
            qc.invalidateQueries({ queryKey: ['tasks', task.projectId] });
            qc.invalidateQueries({ queryKey: ['tasks', 'all'] });
            qc.invalidateQueries({ queryKey: ['subtasks', task.id] });
        },
    });
}

