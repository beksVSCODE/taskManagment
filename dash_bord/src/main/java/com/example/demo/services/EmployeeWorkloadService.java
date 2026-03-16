package com.example.demo.services;

import com.example.demo.dto.response.EmployeeProjectDTO;
import com.example.demo.dto.response.EmployeeTaskDTO;
import com.example.demo.dto.response.EmployeeWorkloadDTO;
import com.example.demo.dto.response.EmployeeWorkloadDetailsDTO;
import com.example.demo.entity.Department;
import com.example.demo.entity.Task;
import com.example.demo.entity.TaskAssignee;
import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import com.example.demo.enums.TaskStatus;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repositories.DepartmentRepository;
import com.example.demo.repositories.TaskAssigneeRepository;
import com.example.demo.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeWorkloadService {

    private final UserRepository userRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final DepartmentRepository departmentRepository;

    public List<EmployeeWorkloadDTO> getEmployeesWorkload(String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        List<User> visibleEmployees = resolveVisibleEmployees(requester);

        if (visibleEmployees.isEmpty()) {
            return List.of();
        }

        List<Long> userIds = visibleEmployees.stream().map(User::getId).toList();
        List<TaskAssignee> assignments = taskAssigneeRepository.findByUserIdsWithTaskAndProject(userIds);

        Map<Long, List<TaskAssignee>> assignmentsByUserId = assignments.stream()
                .collect(Collectors.groupingBy(a -> a.getUser().getId()));

        Map<Long, String> managerDepartments = buildManagerDepartmentMap();

        return visibleEmployees.stream()
                .map(user -> {
                    List<TaskAssignee> userAssignments = assignmentsByUserId.getOrDefault(user.getId(), List.of());
                    Stats stats = computeStats(userAssignments);

                    EmployeeWorkloadDTO dto = new EmployeeWorkloadDTO();
                    dto.setId(user.getId());
                    dto.setName(user.getFullName());
                    dto.setPosition(user.getRole() != null ? user.getRole().name() : null);
                    dto.setDepartment(resolveDepartmentName(user, managerDepartments));
                    dto.setTotalTasks(stats.totalTasks());
                    dto.setActiveTasks(stats.activeTasks());
                    dto.setCompletedTasks(stats.completedTasks());
                    dto.setOverdueTasks(stats.overdueTasks());
                    dto.setWorkloadStatus(resolveWorkloadStatus(stats.activeTasks()));
                    return dto;
                })
                .sorted(Comparator.comparing(EmployeeWorkloadDTO::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public EmployeeWorkloadDetailsDTO getEmployeeWorkloadDetails(Long employeeId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        List<User> visibleEmployees = resolveVisibleEmployees(requester);

        User employee = visibleEmployees.stream()
                .filter(u -> u.getId().equals(employeeId))
                .findFirst()
                .orElseGet(() -> userRepository.findById(employeeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Сотрудник не найден")));

        boolean hasAccess = visibleEmployees.stream().anyMatch(u -> u.getId().equals(employee.getId()));
        if (!hasAccess) {
            throw new AccessDeniedException("Нет доступа к загруженности этого сотрудника");
        }

        List<TaskAssignee> assignments = taskAssigneeRepository.findByUserIdWithTaskAndProject(employee.getId());
        Stats stats = computeStats(assignments);

        Map<Long, String> managerDepartments = buildManagerDepartmentMap();

        EmployeeWorkloadDetailsDTO details = new EmployeeWorkloadDetailsDTO();

        EmployeeWorkloadDetailsDTO.Employee employeeBlock = new EmployeeWorkloadDetailsDTO.Employee();
        employeeBlock.setId(employee.getId());
        employeeBlock.setName(employee.getFullName());
        employeeBlock.setPosition(employee.getRole() != null ? employee.getRole().name() : null);
        employeeBlock.setDepartment(resolveDepartmentName(employee, managerDepartments));
        employeeBlock.setRole(employee.getRole() != null ? employee.getRole().name() : null);
        details.setEmployee(employeeBlock);

        EmployeeWorkloadDetailsDTO.Statistics statistics = new EmployeeWorkloadDetailsDTO.Statistics();
        statistics.setTotalTasks(stats.totalTasks());
        statistics.setActiveTasks(stats.activeTasks());
        statistics.setCompletedTasks(stats.completedTasks());
        statistics.setOverdueTasks(stats.overdueTasks());
        statistics.setWorkloadStatus(resolveWorkloadStatus(stats.activeTasks()));
        details.setStatistics(statistics);

        EmployeeWorkloadDetailsDTO.TaskStatusStats taskStatusStats = new EmployeeWorkloadDetailsDTO.TaskStatusStats();
        taskStatusStats.setActive(stats.activeTasks());
        taskStatusStats.setCompleted(stats.completedTasks());
        taskStatusStats.setOverdue(stats.overdueTasks());
        details.setTaskStatusStats(taskStatusStats);

        Map<Long, EmployeeProjectDTO> projectMap = new LinkedHashMap<>();
        List<EmployeeTaskDTO> tasks = new ArrayList<>();

        for (TaskAssignee assignee : assignments) {
            Task task = assignee.getTask();
            if (task == null) {
                continue;
            }

            if (task.getProject() != null) {
                projectMap.putIfAbsent(
                        task.getProject().getId(),
                        new EmployeeProjectDTO(task.getProject().getId(), task.getProject().getName()));
            }

            EmployeeTaskDTO taskDto = new EmployeeTaskDTO();
            taskDto.setId(task.getId());
            taskDto.setTitle(task.getTitle());
            taskDto.setProject(task.getProject() != null ? task.getProject().getName() : null);
            taskDto.setPriority(task.getPriority() != null ? task.getPriority().name() : null);
            taskDto.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
            taskDto.setDeadline(task.getDueDate());
            taskDto.setOverdue(isTaskOverdue(task));
            tasks.add(taskDto);
        }

        tasks = tasks.stream()
                .collect(Collectors.toMap(EmployeeTaskDTO::getId, t -> t, (left, right) -> left, LinkedHashMap::new))
                .values().stream()
                .sorted(Comparator
                        .comparing(EmployeeTaskDTO::getDeadline,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(EmployeeTaskDTO::getId))
                .toList();

        details.setProjects(new ArrayList<>(projectMap.values()));
        details.setTasks(tasks);

        return details;
    }

    private List<User> resolveVisibleEmployees(User requester) {
        if (requester.getRole() == null) {
            throw new AccessDeniedException("Роль пользователя не определена");
        }

        return switch (requester.getRole()) {
            case ADMIN -> userRepository.findAllActiveWithDepartment();
            case MANAGER -> resolveManagerEmployees(requester);
            case PM -> resolvePmEmployees(requester);
            default -> throw new AccessDeniedException("Недостаточно прав для просмотра загруженности сотрудников");
        };
    }

    private List<User> resolveManagerEmployees(User manager) {
        Department department = departmentRepository.findFirstByManagerId(manager.getId())
                .orElseThrow(() -> new AccessDeniedException("Для руководителя не найден отдел"));

        List<User> users = new ArrayList<>(userRepository.findActiveByDepartmentIdWithDepartment(department.getId()));

        boolean containsManager = users.stream().anyMatch(u -> u.getId().equals(manager.getId()));
        if (!containsManager && manager.isActive()) {
            users.add(manager);
        }

        return users;
    }

    private List<User> resolvePmEmployees(User pm) {
        List<Long> userIds = taskAssigneeRepository.findDistinctActiveUserIdsByPmId(pm.getId());
        if (userIds.isEmpty()) {
            return pm.isActive() ? List.of(pm) : List.of();
        }

        Set<Long> ids = new LinkedHashSet<>(userIds);
        if (pm.isActive()) {
            ids.add(pm.getId());
        }

        return userRepository.findActiveByIdsWithDepartment(new ArrayList<>(ids));
    }

    private Stats computeStats(List<TaskAssignee> assignments) {
        LocalDate today = LocalDate.now();

        long completed = assignments.stream()
                .map(TaskAssignee::getTask)
                .filter(t -> t != null && t.getStatus() == TaskStatus.DONE)
                .count();

        long active = assignments.stream()
                .map(TaskAssignee::getTask)
                .filter(t -> t != null && t.getStatus() != TaskStatus.DONE)
                .count();

        long overdue = assignments.stream()
                .map(TaskAssignee::getTask)
                .filter(t -> t != null
                        && t.getDueDate() != null
                        && t.getDueDate().isBefore(today)
                        && t.getStatus() != TaskStatus.DONE)
                .count();

        long total = assignments.stream()
                .map(TaskAssignee::getTask)
                .filter(t -> t != null)
                .count();

        return new Stats(total, active, completed, overdue);
    }

    private String resolveWorkloadStatus(long activeTasks) {
        if (activeTasks < 5) {
            return "GREEN";
        }
        if (activeTasks <= 10) {
            return "YELLOW";
        }
        return "RED";
    }

    private String resolveDepartmentName(User user, Map<Long, String> managerDepartments) {
        if (user.getDepartment() != null) {
            return user.getDepartment().getName();
        }

        if (user.getRole() == Role.MANAGER) {
            return managerDepartments.get(user.getId());
        }

        return null;
    }

    private Map<Long, String> buildManagerDepartmentMap() {
        return departmentRepository.findAll().stream()
                .filter(d -> d.getManager() != null)
                .collect(Collectors.toMap(d -> d.getManager().getId(), Department::getName, (a, b) -> a, HashMap::new));
    }

    private boolean isTaskOverdue(Task task) {
        return task.getDueDate() != null
                && task.getDueDate().isBefore(LocalDate.now())
                && task.getStatus() != TaskStatus.DONE;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
    }

    private record Stats(long totalTasks, long activeTasks, long completedTasks, long overdueTasks) {
    }
}
