package com.example.demo.services;

import com.example.demo.dto.request.SubtaskRequest;
import com.example.demo.dto.request.SubtaskStatusRequest;
import com.example.demo.dto.request.SubtaskUpdateRequest;
import com.example.demo.dto.response.SubtaskResponse;
import com.example.demo.entity.Subtask;
import com.example.demo.entity.SubtaskAssignee;
import com.example.demo.entity.Task;
import com.example.demo.entity.TaskAssignee;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.enums.TaskStatus;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repositories.SubtaskAssigneeRepository;
import com.example.demo.repositories.SubtaskRepository;
import com.example.demo.repositories.TaskRepository;
import com.example.demo.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final SubtaskAssigneeRepository subtaskAssigneeRepository;

    // =========================================================
    // 1. Получение списка подзадач
    // =========================================================
    public List<SubtaskResponse> getByTask(Long taskId, String email) {
        Task task = findTask(taskId);
        User user = getUser(email);

        validateTaskScope(user, task, "VIEW");

        return subtaskRepository.findByTaskId(taskId).stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // 2. Создание подзадачи с поддержкой нескольких исполнителей
    // ADMIN - в любой задаче
    // MANAGER - только в задачах своего отдела
    // PM - только в задачах своего проекта
    // =========================================================
    public SubtaskResponse create(Long taskId, SubtaskRequest request, String email) {
        User user = getUser(email);
        Task task = findTask(taskId);

        if (user.getRole() != Role.ADMIN &&
                user.getRole() != Role.MANAGER &&
                user.getRole() != Role.PM) {
            throw new AccessDeniedException("Создавать подзадачи может только администратор, руководитель или ПМ");
        }

        validateCreateRequest(request);
        validateTaskScope(user, task, "CREATE");

        // Получаем список исполнителей (новый формат или старый для совместимости)
        List<Long> assigneeIds = request.getAssigneeIds();
        if ((assigneeIds == null || assigneeIds.isEmpty()) && request.getAssigneeId() != null) {
            assigneeIds = List.of(request.getAssigneeId());
        }

        if (assigneeIds == null || assigneeIds.isEmpty()) {
            throw new IllegalArgumentException("Должен быть хотя бы один исполнитель");
        }

        // Валидируем всех исполнителей
        List<User> assignees = new ArrayList<>();
        for (Long id : assigneeIds) {
            User assignee = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не найден: " + id));
            validateAssigneeAccess(user, task, assignee);
            assignees.add(assignee);
        }

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(request.getTitle().trim())
                .assignee(assignees.get(0)) // Совместимость - первый исполнитель как основной
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.NEW)
                .dueDate(request.getDueDate())
                .build();

        Subtask saved = subtaskRepository.save(subtask);

        // Добавляем всех исполнителей через таблицу-связь
        for (User assignee : assignees) {
            SubtaskAssignee sa = SubtaskAssignee.builder()
                    .subtask(saved)
                    .assignee(assignee)
                    .isCompleted(false)
                    .build();
            subtaskAssigneeRepository.save(sa);
        }

        recalculateParentTaskStatus(task);

        return toResponse(saved);
    }

    // =========================================================
    // 3. Обновление подзадачи
    // ADMIN - всё
    // MANAGER - только если это его задача (task.creator)
    // PM - только подзадачи своего проекта
    // =========================================================
    public SubtaskResponse update(Long subtaskId, SubtaskUpdateRequest request, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        validateTaskScope(user, task, "EDIT");

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            subtask.setTitle(request.getTitle().trim());
        }

        if (request.getDueDate() != null) {
            if (request.getDueDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Срок подзадачи должен быть >= текущей даты");
            }
            subtask.setDueDate(request.getDueDate());
        }

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Исполнитель не найден: " + request.getAssigneeId()));

            validateAssigneeAccess(user, task, assignee);

            subtask.setAssignee(assignee);
        }

        Subtask saved = subtaskRepository.save(subtask);
        recalculateParentTaskStatus(task);

        return toResponse(saved);
    }

    // =========================================================
    // 4. Смена статуса подзадачи
    // ADMIN - может
    // PM - может в своём проекте
    // =========================================================
    public SubtaskResponse updateStatus(Long subtaskId, SubtaskStatusRequest request, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        if (user.getRole() == Role.TEAM) {
            if (subtask.getAssignee() == null || !subtask.getAssignee().getId().equals(user.getId())) {
                throw new AccessDeniedException("Отмечать подзадачу выполненной может только её исполнитель");
            }
        } else if (user.getRole() != Role.ADMIN && user.getRole() != Role.PM) {
            throw new AccessDeniedException("Статус подзадачи может менять только администратор, ПМ или исполнитель");
        }

        validateTaskScope(user, task, "STATUS");

        subtask.setStatus(request.getStatus());

        Subtask saved = subtaskRepository.save(subtask);
        recalculateParentTaskStatus(task);

        return toResponse(saved);
    }

    // =========================================================
    // 5. Удаление подзадачи
    // ADMIN - любую
    // MANAGER - только если родительская задача его
    // =========================================================
    public void delete(Long subtaskId, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        if (user.getRole() == Role.ADMIN) {
            subtaskRepository.delete(subtask);
            recalculateParentTaskStatus(task);
            return;
        }

        if (user.getRole() == Role.MANAGER) {
            if (task.getCreator() == null || !task.getCreator().getId().equals(user.getId())) {
                throw new AccessDeniedException("Руководитель может удалять подзадачи только своих задач");
            }

            if (!isManagerDepartmentTask(user, task)) {
                throw new AccessDeniedException("Нет доступа к подзадачам другого отдела");
            }

            subtaskRepository.delete(subtask);
            recalculateParentTaskStatus(task);
            return;
        }

        throw new AccessDeniedException("У вас нет прав на удаление подзадачи");
    }

    // =========================================================
    // Пересчёт статуса родительской задачи
    // =========================================================
    private void recalculateParentTaskStatus(Task task) {
        long total = subtaskRepository.countByTaskId(task.getId());
        long done = subtaskRepository.countByTaskIdAndStatus(task.getId(), TaskStatus.DONE);

        if (total > 0 && total == done) {
            task.setStatus(TaskStatus.DONE);
            task.setCompletedAt(LocalDateTime.now());
            taskRepository.save(task);
        } else {
            if (task.getStatus() == TaskStatus.DONE) {
                task.setStatus(TaskStatus.IN_PROGRESS);
                task.setCompletedAt(null);
                taskRepository.save(task);
            }
        }
    }

    // =========================================================
    // Валидация доступа по родительской задаче
    // =========================================================
    private void validateTaskScope(User user, Task task, String action) {
        Role role = user.getRole();

        if (role == Role.ADMIN) {
            return;
        }

        if (role == Role.MANAGER) {
            if (!isManagerDepartmentTask(user, task)) {
                throw new AccessDeniedException("Нет доступа к подзадачам другого отдела");
            }

            if ("EDIT".equals(action)) {
                if (task.getCreator() == null || !task.getCreator().getId().equals(user.getId())) {
                    throw new AccessDeniedException("Руководитель может редактировать подзадачи только своих задач");
                }
            }

            return;
        }

        if (role == Role.PM) {
            if (task.getProject() == null || task.getProject().getPm() == null ||
                    !task.getProject().getPm().getId().equals(user.getId())) {
                throw new AccessDeniedException("ПМ работает только с подзадачами своего проекта");
            }
            return;
        }

        if (role == Role.TEAM) {
            boolean assignedInTask = task.getAssignees() != null &&
                    task.getAssignees().stream()
                            .map(TaskAssignee::getUser)
                            .anyMatch(u -> u != null && u.getId().equals(user.getId()));

            boolean assignedInSubtask = subtaskRepository.findByTaskId(task.getId()).stream()
                    .anyMatch(st -> st.getAssignee() != null && st.getAssignee().getId().equals(user.getId()));

            if (!assignedInTask && !assignedInSubtask) {
                throw new AccessDeniedException("Команда может видеть только связанные с ней подзадачи");
            }

            if (!"VIEW".equals(action) && !"STATUS".equals(action)) {
                throw new AccessDeniedException("У роли TEAM нет прав на изменение подзадач");
            }

            return;
        }

        throw new AccessDeniedException("Недостаточно прав");
    }

    // =========================================================
    // Общая проверка, кого можно назначать
    // =========================================================
    private void validateAssigneeAccess(User user, Task task, User assignee) {
        if (user.getRole() == Role.ADMIN) {
            validateDepartmentTeamAssignee(task, assignee);
            return;
        }

        if (user.getRole() == Role.MANAGER) {
            validateDepartmentTeamAssignee(task, assignee);
            return;
        }

        if (user.getRole() == Role.PM) {
            if (task.getProject() == null || task.getProject().getPm() == null ||
                    !task.getProject().getPm().getId().equals(user.getId())) {
                throw new AccessDeniedException("ПМ может назначать исполнителей только в своём проекте");
            }

            validateDepartmentTeamAssignee(task, assignee);
        }
    }

    private void validateDepartmentTeamAssignee(Task task, User assignee) {
        if (assignee.getRole() != Role.TEAM) {
            throw new AccessDeniedException("Исполнителем подзадачи может быть только сотрудник отдела");
        }

        if (task.getProject() == null || task.getProject().getDepartment() == null ||
                assignee.getDepartment() == null ||
                !task.getProject().getDepartment().getId().equals(assignee.getDepartment().getId())) {
            throw new AccessDeniedException("Исполнитель подзадачи должен быть сотрудником того же отдела");
        }
    }

    private boolean isManagerDepartmentTask(User user, Task task) {
        return task != null
                && task.getProject() != null
                && task.getProject().getDepartment() != null
                && task.getProject().getDepartment().getManager() != null
                && task.getProject().getDepartment().getManager().getId().equals(user.getId());
    }

    private void validateCreateRequest(SubtaskRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Название подзадачи обязательно");
        }

        // Проверяем наличие хотя бы одного исполнителя (поддерживаем оба формата)
        if ((request.getAssigneeIds() == null || request.getAssigneeIds().isEmpty()) &&
                request.getAssigneeId() == null) {
            throw new IllegalArgumentException("Должен быть хотя бы один исполнитель");
        }

        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Срок выполнения подзадачи обязателен");
        }

        if (request.getDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Срок подзадачи должен быть >= текущей даты");
        }
    }

    // =========================================================
    // 6. Добавление исполнителя к подзадаче
    // =========================================================
    public SubtaskResponse addAssignee(Long subtaskId, Long userId, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        validateTaskScope(user, task, "EDIT");

        User assignee = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден: " + userId));

        validateAssigneeAccess(user, task, assignee);

        // Проверяем, не назначен ли уже
        if (subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), userId).isPresent()) {
            throw new IllegalArgumentException("Этот пользователь уже назначен на подзадачу");
        }

        SubtaskAssignee sa = SubtaskAssignee.builder()
                .subtask(subtask)
                .assignee(assignee)
                .isCompleted(false)
                .build();

        subtaskAssigneeRepository.save(sa);
        return toResponse(subtask);
    }

    // =========================================================
    // 7. Удаление исполнителя из подзадачи
    // =========================================================
    public SubtaskResponse removeAssignee(Long subtaskId, Long userId, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        validateTaskScope(user, task, "EDIT");

        SubtaskAssignee sa = subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не назначен на подзадачу"));

        // Убедимся, что после удаления останется хотя бы один исполнитель
        long remainingCount = subtaskAssigneeRepository.findBySubtaskId(subtask.getId()).size();
        if (remainingCount <= 1) {
            throw new IllegalArgumentException("Должен остаться хотя бы один исполнитель подзадачи");
        }

        subtaskAssigneeRepository.delete(sa);
        return toResponse(subtask);
    }

    // =========================================================
    // 8. Отметить выполнение подзадачи для конкретного исполнителя
    // =========================================================
    public SubtaskResponse markAsCompleted(Long subtaskId, Long userId, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);
        Task task = subtask.getTask();

        // Проверяем, что пользователь назначен на эту подзадачу
        if (user.getRole() == Role.TEAM) {
            SubtaskAssignee sa = subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), user.getId())
                    .orElseThrow(() -> new AccessDeniedException("Вы не назначены на эту подзадачу"));
            
            sa.setIsCompleted(true);
            sa.setCompletedAt(LocalDateTime.now());
            subtaskAssigneeRepository.save(sa);
        } else {
            // ADMIN/PM могут отмечать для других
            SubtaskAssignee sa = subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не назначен на подзадачу"));
            
            sa.setIsCompleted(true);
            sa.setCompletedAt(LocalDateTime.now());
            subtaskAssigneeRepository.save(sa);
        }

        // Проверяем, выполнили ли ВСЕ исполнители
        checkIfAllCompletedAndUpdateSubtaskStatus(subtask, task);

        return toResponse(subtask);
    }

    // =========================================================
    // 9. Отметить невыполненной для конкретного исполнителя
    // =========================================================
    public SubtaskResponse markAsIncomplete(Long subtaskId, Long userId, String email) {
        User user = getUser(email);
        Subtask subtask = getSubtask(subtaskId);

        if (user.getRole() == Role.TEAM) {
            SubtaskAssignee sa = subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), user.getId())
                    .orElseThrow(() -> new AccessDeniedException("Вы не назначены на эту подзадачу"));
            
            sa.setIsCompleted(false);
            sa.setCompletedAt(null);
            subtaskAssigneeRepository.save(sa);
        } else {
            SubtaskAssignee sa = subtaskAssigneeRepository.findBySubtaskIdAndAssigneeId(subtask.getId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не назначен на подзадачу"));
            
            sa.setIsCompleted(false);
            sa.setCompletedAt(null);
            subtaskAssigneeRepository.save(sa);
        }

        return toResponse(subtask);
    }

    // =========================================================
    // 10. Проверка: все ли исполнители выполнили подзадачу?
    // =========================================================
    private void checkIfAllCompletedAndUpdateSubtaskStatus(Subtask subtask, Task task) {
        List<SubtaskAssignee> assignees = subtaskAssigneeRepository.findBySubtaskId(subtask.getId());
        
        boolean allCompleted = assignees.stream().allMatch(SubtaskAssignee::getIsCompleted);
        
        if (allCompleted && !subtask.getStatus().equals(TaskStatus.DONE)) {
            subtask.setStatus(TaskStatus.DONE);
            subtaskRepository.save(subtask);
            recalculateParentTaskStatus(task);
        } else if (!allCompleted && subtask.getStatus().equals(TaskStatus.DONE)) {
            subtask.setStatus(TaskStatus.NEW);
            subtaskRepository.save(subtask);
            recalculateParentTaskStatus(task);
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }

    private Task findTask(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Задача не найдена"));
    }

    private Subtask getSubtask(Long id) {
        return subtaskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Подзадача не найдена: " + id));
    }

    private SubtaskResponse toResponse(Subtask subtask) {
        SubtaskResponse r = new SubtaskResponse();
        r.setId(subtask.getId());
        r.setTitle(subtask.getTitle());
        r.setStatus(subtask.getStatus() != null ? subtask.getStatus().name() : null);
        r.setDueDate(subtask.getDueDate());
        r.setCreatedAt(subtask.getCreatedAt());
        r.setUpdatedAt(subtask.getUpdatedAt());

        if (subtask.getTask() != null) {
            r.setTaskId(subtask.getTask().getId());
        }

        // Для совместимости - первый исполнитель
        if (subtask.getAssignee() != null) {
            r.setAssigneeId(subtask.getAssignee().getId());
            r.setAssigneeName(subtask.getAssignee().getFullName());
        }

        // Новое: список всех исполнителей
        List<SubtaskAssignee> subtaskAssignees = subtaskAssigneeRepository.findBySubtaskId(subtask.getId());
        
        r.setAssigneeIds(subtaskAssignees.stream()
                .map(sa -> sa.getAssignee().getId())
                .collect(Collectors.toList()));
        
        r.setAssigneeNames(subtaskAssignees.stream()
                .map(sa -> sa.getAssignee().getFullName())
                .collect(Collectors.toList()));
        
        r.setAssigneeStatuses(subtaskAssignees.stream()
                .map(sa -> {
                    SubtaskResponse.AssigneeStatus status = new SubtaskResponse.AssigneeStatus();
                    status.setAssigneeId(sa.getAssignee().getId());
                    status.setAssigneeName(sa.getAssignee().getFullName());
                    status.setIsCompleted(sa.getIsCompleted());
                    status.setCompletedAt(sa.getCompletedAt());
                    return status;
                })
                .collect(Collectors.toList()));

        return r;
    }
}
