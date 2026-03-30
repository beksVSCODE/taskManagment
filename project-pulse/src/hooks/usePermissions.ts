import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';

export function usePermissions() {
    const { currentUser } = useAuth();
    const rawRole = ((currentUser?.role as unknown as string) ?? 'TEAM').toUpperCase();
    const roleName = rawRole.startsWith('ROLE_') ? rawRole.slice(5) : rawRole;
    const uid = currentUser?.id ?? '';

    return {
        // ── 15. Manage Users ──────────────────────────────────
        // ADMIN only
        canManageUsers: roleName === 'ADMIN',

        // ── 16. Manage Departments ────────────────────────────
        // ADMIN only
        canManageDepartments: roleName === 'ADMIN',
        canViewManagement: roleName === 'ADMIN' || roleName === 'MANAGER', // sidebar "Отделы"

        // ── Projects ─────────────────────────────────────────
        // 2. Create Projects: ADMIN, MANAGER, PM
        canCreateProject: roleName === 'ADMIN' || roleName === 'MANAGER' || roleName === 'PM',
        canDeleteProject: roleName === 'ADMIN' || roleName === 'MANAGER' || roleName === 'PM',
        canAssignPM: roleName === 'ADMIN' || roleName === 'MANAGER',

        // 1. View Projects (filter happens server-side)
        canViewProject: (_project: Project) => {
            return roleName === 'ADMIN' || roleName === 'MANAGER' || roleName === 'PM' || roleName === 'TEAM';
        },

        // ── Tasks ─────────────────────────────────────────────
        // 3. Create Tasks: ADMIN, MANAGER, PM (own projects)
        canCreateTask: (_project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;
            if (roleName === 'PM' && _project?.pmId === uid) return true;
            return false;
        },

        // 5. Edit Tasks: ADMIN, MANAGER (own tasks), PM
        canEditTask: (task: Task, project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return task.creatorId === uid; // backend: manager edits only own tasks
            if (roleName === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 5. Change Priority (part of Edit): ADMIN, MANAGER, PM
        canChangePriority: (project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;
            if (roleName === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 6. Change Task Status: ADMIN, MANAGER, PM, TEAM (для TEAM — назначенные задачи)
        canChangeStatus: (task: Task, project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;
            if (roleName === 'PM') return project?.pmId === uid;
            if (roleName === 'TEAM') {
                return task.assigneeIds?.includes(uid) ?? false;
            }
            return false;
        },

        // 7. Change Assignees: ADMIN, MANAGER only
        canAssignMembers: (_project?: Project) => {
            return roleName === 'ADMIN' || roleName === 'MANAGER';
        },

        // 8. Delete Tasks: ADMIN, MANAGER only
        canDeleteTask: (_task: Task, _project?: Project) => {
            return roleName === 'ADMIN' || roleName === 'MANAGER';
        },

        // 6. Drag on Kanban = change status
        // Для TEAM — только назначенные задачи
        canDragTask: (task: Task, project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;    // видит только свои задачи отдела
            if (roleName === 'PM') return project?.pmId === uid;
            if (roleName === 'TEAM') {
                return task.assigneeIds?.includes(uid) ?? false;
            }
            return false;
        },

        // ── Subtasks ──────────────────────────────────────────
        // 9. Create Subtasks: ADMIN, MANAGER, PM
        canCreateSubtask: (project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;
            if (roleName === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 10. Change Subtask Status: ADMIN, PM, назначенный исполнитель
        canChangeSubtaskStatus: (subtaskAssigneeId?: string, project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'PM' && project?.pmId === uid) return true;
            if (roleName === 'TEAM' && subtaskAssigneeId === uid) return true;
            return false;
        },

        // Delete Subtask: ADMIN, MANAGER only
        canDeleteSubtask: () => {
            return roleName === 'ADMIN' || roleName === 'MANAGER';
        },

        // ── Comments ─────────────────────────────────────────
        // 11. Comment: all roles
        canComment: true,

        // 12. Attach Files to Task: ADMIN, MANAGER, PM
        canAttachToTask: (project?: Project) => {
            if (roleName === 'ADMIN') return true;
            if (roleName === 'MANAGER') return true;
            if (roleName === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 13. Attach Files to Comment: all roles
        canAttachToComment: true,

        // ── Navigation ────────────────────────────────────────
        // 14. View Analytics: ADMIN, MANAGER only
        canViewAnalytics: roleName === 'ADMIN' || roleName === 'MANAGER',

        // Employees workload: ADMIN, LEADER, PM
        // В текущем backend роль LEADER эквивалентна MANAGER
        canViewEmployeesWorkload:
            roleName === 'ADMIN' || roleName === 'PM' || roleName === 'MANAGER' || roleName === 'LEADER',
    };
}

