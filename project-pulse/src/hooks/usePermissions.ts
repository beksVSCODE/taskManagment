import { useAuth } from '@/contexts/AuthContext';
import { Task, Project } from '@/types';

export function usePermissions() {
    const { currentUser } = useAuth();
    const role = currentUser?.role ?? 'TEAM';
    const roleName = (currentUser?.role as unknown as string) ?? 'TEAM';
    const uid = currentUser?.id ?? '';

    return {
        // ── 15. Manage Users ──────────────────────────────────
        // ADMIN only
        canManageUsers: role === 'ADMIN',

        // ── 16. Manage Departments ────────────────────────────
        // ADMIN only
        canManageDepartments: role === 'ADMIN',
        canViewManagement: role === 'ADMIN' || role === 'MANAGER', // sidebar "Отделы"

        // ── Projects ─────────────────────────────────────────
        // 2. Create Projects: ADMIN, MANAGER, PM
        canCreateProject: role === 'ADMIN' || role === 'MANAGER' || role === 'PM',
        canAssignPM: role === 'ADMIN' || role === 'MANAGER',

        // 1. View Projects (filter happens server-side)
        canViewProject: (_project: Project) => {
            return role === 'ADMIN' || role === 'MANAGER' || role === 'PM' || role === 'TEAM';
        },

        // ── Tasks ─────────────────────────────────────────────
        // 3. Create Tasks: ADMIN, MANAGER, PM (own projects)
        canCreateTask: (_project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'MANAGER') return true;
            if (role === 'PM' && _project?.pmId === uid) return true;
            return false;
        },

        // 5. Edit Tasks: ADMIN, MANAGER (own tasks), PM
        canEditTask: (task: Task, project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'MANAGER') return true; // backend enforces "own tasks only"
            if (role === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 5. Change Priority (part of Edit): ADMIN, MANAGER, PM
        canChangePriority: (project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'MANAGER') return true;
            if (role === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 6. Change Task Status: ADMIN, PM, TEAM (assigned tasks only)
        canChangeStatus: (task: Task, project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'PM' && project?.pmId === uid) return true;
            if (role === 'MANAGER') return true;
            if (role === 'TEAM') return task.assigneeIds?.includes(uid) ?? false;
            return false;
        },

        // 7. Change Assignees: ADMIN, MANAGER only
        canAssignMembers: (_project?: Project) => {
            return role === 'ADMIN' || role === 'MANAGER';
        },

        // 8. Delete Tasks: ADMIN, MANAGER only
        canDeleteTask: (_task: Task, _project?: Project) => {
            return role === 'ADMIN' || role === 'MANAGER';
        },

        // 6. Drag on Kanban = change status: ADMIN, PM, TEAM (assigned tasks only)
        canDragTask: (task: Task) => {
            if (role === 'ADMIN') return true;
            if (role === 'PM') return true;
            if (role === 'MANAGER') return true;
            if (role === 'TEAM') return task.assigneeIds?.includes(uid) ?? false;
            return false;
        },

        // ── Subtasks ──────────────────────────────────────────
        // 9. Create Subtasks: ADMIN, MANAGER, PM
        canCreateSubtask: (project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'MANAGER') return true;
            if (role === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 10. Change Subtask Status: ADMIN, PM only
        canChangeSubtaskStatus: (project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // Delete Subtask: ADMIN, MANAGER only
        canDeleteSubtask: () => {
            return role === 'ADMIN' || role === 'MANAGER';
        },

        // ── Comments ─────────────────────────────────────────
        // 11. Comment: all roles
        canComment: true,

        // 12. Attach Files to Task: ADMIN, MANAGER, PM
        canAttachToTask: (project?: Project) => {
            if (role === 'ADMIN') return true;
            if (role === 'MANAGER') return true;
            if (role === 'PM' && project?.pmId === uid) return true;
            return false;
        },

        // 13. Attach Files to Comment: all roles
        canAttachToComment: true,

        // ── Navigation ────────────────────────────────────────
        // 14. View Analytics: ADMIN, MANAGER only
        canViewAnalytics: role === 'ADMIN' || role === 'MANAGER',

        // Employees workload: ADMIN, LEADER, PM
        // В текущем backend роль LEADER эквивалентна MANAGER
        canViewEmployeesWorkload:
            role === 'ADMIN' || role === 'PM' || role === 'MANAGER' || roleName === 'LEADER',
    };
}

