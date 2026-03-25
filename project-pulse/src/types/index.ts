// Роли совпадают с backend enum Role (в lowercase для удобства)
export type Role = 'ADMIN' | 'MANAGER' | 'PM' | 'TEAM';

// Статусы задач (backend enum TaskStatus)
export type TaskStatus = 'NEW' | 'IN_PROGRESS' | 'ON_REVIEW' | 'DONE';

// Приоритеты (backend enum Priority)
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

// ─── Отдел (из DepartmentDto) ────────────────────────────────────────────────
export interface Department {
    id: number;
    name: string;
    manager?: {
        id: number;
        fullName: string;
        email: string;
        role: string;
    };
}

// ─── Пользователь (из MeDto + UserDto) ──────────────────────────────────────
export interface User {
    id: string;           // backend: Long → конвертируем в string
    name: string;         // backend: fullName
    email: string;
    role: Role;
    department: string;   // backend: departmentName
    departmentId?: number;
    active?: boolean;
}

// ─── Проект (из ProjectController → Project entity) ─────────────────────────
export interface Project {
    id: string;
    name: string;
    description: string;
    department: string;   // departmentName
    departmentId?: number;
    pmId: string;         // backend: pm.id
    pmName?: string;
    teamMemberIds: string[];
    memberNames?: string[];
    status?: string;
    taskCount?: number;
}

// ─── Подзадача (из SubtaskResponse) ─────────────────────────────────────────
export interface Subtask {
    id: string;
    title: string;
    assigneeId?: string;
    assigneeName?: string;
    status: 'NEW' | 'DONE';
    dueDate?: string;
}

// ─── Вложение (из AttachmentResponse) ───────────────────────────────────────
export interface Attachment {
    id: string;
    name: string;
    size: number;
    addedBy: string;
    addedAt: string;
    url?: string;
}

// ─── Комментарий (из CommentResponse) ───────────────────────────────────────
export interface Comment {
    id: string;
    taskId: string;
    authorId: string;
    authorName?: string;
    text: string;
    createdAt: string;
    attachments: Attachment[];
}

// ─── Журнал изменений задачи (из TaskHistoryResponse) ───────────────────────
export interface AuditLogEvent {
    id: string;
    taskId: string;
    userId: string;
    userName?: string;
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    timestamp: string;
}

// ─── Задача (из TaskResponse) ────────────────────────────────────────────────
export interface Task {
    id: string;
    projectId: string;
    projectName?: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: Priority;
    creatorId: string;
    creatorName?: string;
    pmId?: string;
    pmName?: string;
    assigneeIds: string[];
    assigneeNames?: string[];
    watcherIds: string[];
    startDate?: string;
    dueDate: string;
    createdAt: string;
    completedAt?: string;
    isOverdue?: boolean;
    tags: string[];
    tagNames?: string[];
    subtasks: Subtask[];
    subtaskCount?: number;
    completedSubtaskCount?: number;
    comments: Comment[];
    attachments: Attachment[];
    auditLog: AuditLogEvent[];
}

// ─── Уведомление (из NotificationResponse) ──────────────────────────────────
export type NotificationType =
    | 'TASK_ASSIGNED'
    | 'STATUS_CHANGED'
    | 'NEW_COMMENT'
    | 'MENTION'
    | 'TASK_OVERDUE';

export interface AppNotification {
    id: string;
    userId: string;
    type: NotificationType;
    message: string;
    taskId?: string;
    taskTitle?: string;
    projectId?: string;
    read: boolean;
    createdAt: string;
}

// ─── Аутентификация ──────────────────────────────────────────────────────────
export interface AuthUser {
    id: number;
    fullName: string;
    email: string;
    role: Role;
    departmentId?: number;
    departmentName?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface JwtResponse {
    token: string;
    email: string;
    role: Role;
    fullName: string;
}

export type WorkloadStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface EmployeeWorkload {
    id: string;
    name: string;
    position: string;
    department: string;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    overdueTasks: number;
    workloadPercent?: number;
    workloadStatus: WorkloadStatus;
}

export interface EmployeeProject {
    id: string;
    name: string;
}

export interface EmployeeTask {
    id: string;
    title: string;
    project: string;
    priority: string;
    status: string;
    deadline?: string;
    isOverdue: boolean;
}

export interface EmployeeWorkloadDetails {
    employee: {
        id: string;
        name: string;
        position: string;
        department: string;
        role: string;
    };
    statistics: {
        totalTasks: number;
        activeTasks: number;
        completedTasks: number;
        overdueTasks: number;
        workloadPercent?: number;
        workloadStatus: WorkloadStatus;
    };
    projects: EmployeeProject[];
    taskStatusStats: {
        active: number;
        completed: number;
        overdue: number;
    };
    tasks: EmployeeTask[];
}

export interface VoiceAssigneeCandidate {
    id: string;
    fullName: string;
    score: number;
}

export interface VoiceTaskDraft {
    transcript: string;
    assigneeRaw?: string;
    assigneeId?: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority?: Priority;
    confidence: number;
    warnings: string[];
    missingFields: string[];
    assigneeCandidates: VoiceAssigneeCandidate[];
}

export interface VoiceTaskConfirmPayload {
    title: string;
    description?: string;
    dueDate: string;
    assigneeId: string;
    priority?: Priority;
    transcript?: string;
    confidence?: number;
}

