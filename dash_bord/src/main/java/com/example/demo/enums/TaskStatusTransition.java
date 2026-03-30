package com.example.demo.enums;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

/**
 * Централизованная матрица допустимых переходов между статусами задачи.
 *
 * <pre>
 *   NEW         → IN_PROGRESS
 *   IN_PROGRESS → NEW, REVIEW
 *   REVIEW      → IN_PROGRESS, DONE
 *   DONE        → REVIEW  (только привилегированные роли: ADMIN, MANAGER, PM)
 * </pre>
 *
 * Зеркальное определение находится на frontend:
 * src/lib/taskStatusTransitions.ts
 * При изменении матрицы обновляйте оба файла.
 */
public final class TaskStatusTransition {

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED;

    static {
        Map<TaskStatus, Set<TaskStatus>> map = new EnumMap<>(TaskStatus.class);
        map.put(TaskStatus.NEW, EnumSet.of(TaskStatus.IN_PROGRESS));
        map.put(TaskStatus.IN_PROGRESS, EnumSet.of(TaskStatus.NEW, TaskStatus.REVIEW));
        map.put(TaskStatus.REVIEW, EnumSet.of(TaskStatus.IN_PROGRESS, TaskStatus.DONE));
        map.put(TaskStatus.DONE, EnumSet.of(TaskStatus.REVIEW)); // reopening only
        ALLOWED = Map.copyOf(map);
    }

    /**
     * Возвращает true, если переход from → to разрешён правилами матрицы.
     */
    public static boolean isAllowed(TaskStatus from, TaskStatus to) {
        if (from == null || to == null || from == to)
            return false;
        Set<TaskStatus> targets = ALLOWED.get(from);
        return targets != null && targets.contains(to);
    }

    /**
     * Возвращает true, если переход ИЗ данного статуса требует привилегированной
     * роли.
     * TEAM не может переоткрыть задачу из DONE.
     */
    public static boolean requiresPrivilege(TaskStatus from) {
        return from == TaskStatus.DONE;
    }

    private TaskStatusTransition() {
        throw new UnsupportedOperationException("Utility class");
    }
}
