import { TaskStatus } from '@/types';

/**
 * Централизованная матрица допустимых переходов статусов задачи.
 * Зеркало backend: com.example.demo.enums.TaskStatusTransition.java
 *
 * При изменении матрицы — обновляйте оба файла.
 *
 *   NEW         → IN_PROGRESS
 *   IN_PROGRESS → NEW, REVIEW
 *   REVIEW      → IN_PROGRESS, DONE
 *   DONE        → REVIEW, IN_PROGRESS
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    NEW: ['IN_PROGRESS'],
    IN_PROGRESS: ['NEW', 'REVIEW'],
    REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['REVIEW', 'IN_PROGRESS'],
};

/**
 * Проверяет, допустим ли переход from → to.
 * Не учитывает роль — только матрицу переходов.
 */
export function isTransitionAllowed(from: TaskStatus, to: TaskStatus): boolean {
    if (from === to) return false;
    return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Возвращает true, если переход ИЗ данного статуса требует привилегированной роли.
 */
export function requiresPrivilege(from: TaskStatus): boolean {
    return false;
}
