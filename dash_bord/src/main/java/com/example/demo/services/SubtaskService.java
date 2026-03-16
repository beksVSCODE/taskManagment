package com.example.demo.services;

import com.example.demo.dto.request.SubtaskRequest;
import com.example.demo.dto.request.SubtaskStatusRequest;
import com.example.demo.dto.request.SubtaskUpdateRequest;
import com.example.demo.dto.response.SubtaskResponse;
import com.example.demo.entity.Subtask;
import com.example.demo.entity.Task;
import com.example.demo.entity.TaskAssignee;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.enums.TaskStatus;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repositories.SubtaskRepository;
import com.example.demo.repositories.TaskRepository;
import com.example.demo.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

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
    // 2. Создание подзадачи
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

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не найден: " + request.getAssigneeId()));

        validateAssigneeAccess(user, task, assignee);

        Subtask subtask = Subtask.builder()
                .task(task)
                .title(request.getTitle().trim())
                .assignee(assignee)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.NEW)
                .dueDate(request.getDueDate())
                .build();

        Subtask saved = subtaskRepository.save(subtask);
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
                    .orElseThrow(() -> new ResourceNotFoundException("Исполнитель не найден: " + request.getAssigneeId()));

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

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.PM) {
            throw new AccessDeniedException("Статус подзадачи может менять только администратор или ПМ");
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

            if (!"VIEW".equals(action)) {
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
            return;
        }

        if (user.getRole() == Role.MANAGER) {
            if (assignee.getRole() != Role.PM && assignee.getRole() != Role.TEAM) {
                throw new AccessDeniedException("Руководитель может назначать только PM и TEAM");
            }

            if (task.getProject() == null || task.getProject().getDepartment() == null ||
                    assignee.getDepartment() == null ||
                    !task.getProject().getDepartment().getId().equals(assignee.getDepartment().getId())) {
                throw new AccessDeniedException("Исполнитель подзадачи должен быть из того же отдела");
            }
            return;
        }

        if (user.getRole() == Role.PM) {
            if (task.getProject() == null || task.getProject().getPm() == null ||
                    !task.getProject().getPm().getId().equals(user.getId())) {
                throw new AccessDeniedException("ПМ может назначать исполнителей только в своём проекте");
            }

            if (assignee.getRole() != Role.PM && assignee.getRole() != Role.TEAM) {
                throw new AccessDeniedException("ПМ может назначать только PM и TEAM");
            }

            if (task.getProject().getDepartment() != null) {
                if (assignee.getDepartment() == null ||
                        !task.getProject().getDepartment().getId().equals(assignee.getDepartment().getId())) {
                    throw new AccessDeniedException("Исполнитель подзадачи должен быть из того же отдела");
                }
            }
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

        if (request.getAssigneeId() == null) {
            throw new IllegalArgumentException("Исполнитель подзадачи обязателен");
        }

        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Срок выполнения подзадачи обязателен");
        }

        if (request.getDueDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Срок подзадачи должен быть >= текущей даты");
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

        if (subtask.getAssignee() != null) {
            r.setAssigneeId(subtask.getAssignee().getId());
            r.setAssigneeName(subtask.getAssignee().getFullName());
        }

        return r;
    }
}
