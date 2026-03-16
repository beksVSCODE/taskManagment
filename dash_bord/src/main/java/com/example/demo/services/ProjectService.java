package com.example.demo.services;

import com.example.demo.dto.request.ProjectRequest;
import com.example.demo.dto.response.ProjectResponse;
import com.example.demo.entity.*;
import com.example.demo.enums.Role;
import com.example.demo.exception.AccessDeniedException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final TaskRepository taskRepository;

    public Project create(ProjectRequest request, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        User pm = null;
        if (request.getPmId() != null) {
            pm = userRepository.findById(request.getPmId())
                    .orElseThrow(() -> new ResourceNotFoundException("ПМ не найден"));
        }

        Department department = null;

        // ADMIN — может сам указать departmentId
        if (currentUser.getRole() == Role.ADMIN) {
            if (request.getDepartmentId() != null) {
                department = departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Отдел не найден"));
            }
        }

        // MANAGER — только свой департамент
        else if (currentUser.getRole() == Role.MANAGER) {
            department = departmentRepository.findFirstByManagerId(currentUser.getId())
                    .orElseThrow(() -> new AccessDeniedException("У руководителя нет назначенного департамента"));
        }

        // PM — свой отдел, себя назначает PM
        else if (currentUser.getRole() == Role.PM) {
            department = currentUser.getDepartment();
            if (department == null) {
                throw new AccessDeniedException("У PM нет назначенного отдела");
            }
            // PM всегда назначает себя PM проекта
            pm = currentUser;
        }

        else {
            throw new AccessDeniedException("У вас нет прав на создание проекта");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .pm(pm)
                .department(department)
                .build();

        return projectRepository.save(project);
    }

    public List<Project> getAll(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));
        Department department = null;
        if (user.getRole() == Role.MANAGER) {
            department = departmentRepository.findFirstByManagerId(user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Manager не состоит в департаментах"));
        }

        return switch (user.getRole()) {
            case ADMIN -> projectRepository.findAll();
            case MANAGER -> projectRepository.findByDepartmentId(department.getId());
            case PM -> projectRepository.findByPmId(user.getId());
            case TEAM -> {
                // TEAM видит все проекты своего отдела
                Department dept = user.getDepartment();
                if (dept != null) {
                    yield projectRepository.findByDepartmentId(dept.getId());
                }
                // фоллбэк: если отдел не назначен, ищем через project_members
                yield projectRepository.findByMemberUserId(user.getId());
            }
        };
    }

    public Project getById(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        Project p = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Проект не найден: " + id));

        // ADMIN — видит всё
        if (user.getRole() == Role.ADMIN) {
            return p;
        }

        // MANAGER — только проекты своего департамента
        if (user.getRole() == Role.MANAGER) {
            if (!Objects.equals(p.getDepartment().getManager().getId(), user.getId())) {
                throw new AccessDeniedException("У руководителя нет назначенного департамента");
            }
            return p;
        }

        // PM — только свои проекты
        if (user.getRole() == Role.PM) {
            if (p.getPm() == null || !p.getPm().getId().equals(user.getId())) {
                throw new AccessDeniedException("Нет доступа к чужому проекту");
            }

            return p;
        }

        // TEAM — проекты своего отдела или через project_members
        if (user.getRole() == Role.TEAM) {
            Department dept = user.getDepartment();
            if (dept != null && p.getDepartment() != null
                    && dept.getId().equals(p.getDepartment().getId())) {
                return p;
            }
            boolean isMember = p.getMembers() != null &&
                    p.getMembers().stream()
                            .anyMatch(m -> m.getUser().getId().equals(user.getId()));
            if (!isMember) {
                throw new AccessDeniedException("Нет доступа к проекту");
            }
            return p;
        }

        throw new AccessDeniedException("У вас нет прав на просмотр проекта");
    }

    public Project update(Long id, ProjectRequest request, String email) {
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Пользователь не найден"));

        Project project = getById(id, email);

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            project.setName(request.getName().trim());
        }

        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }

        // ADMIN может менять департамент вручную
        if (currentUser.getRole() == Role.ADMIN) {
            if (request.getDepartmentId() != null) {
                Department department = departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Отдел не найден"));
                project.setDepartment(department);
            }
        }

        // MANAGER не может менять проект на чужой департамент
        if (currentUser.getRole() == Role.MANAGER) {
            if (project.getDepartment() == null ||
                    project.getDepartment().getManager() == null ||
                    !project.getDepartment().getManager().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Вы можете редактировать только проекты своего департамента");
            }
        }

        // смена PM
        if (request.getPmId() != null) {
            User pm = userRepository.findById(request.getPmId())
                    .orElseThrow(() -> new ResourceNotFoundException("ПМ не найден"));

            if (pm.getRole() != Role.PM) {
                throw new IllegalArgumentException("Назначенный пользователь должен иметь роль PM");
            }

            // если у проекта есть департамент — PM должен быть из того же департамента
            if (project.getDepartment() != null) {
                if (pm.getDepartment() == null ||
                        !pm.getDepartment().getId().equals(project.getDepartment().getId())) {
                    throw new IllegalArgumentException("PM должен принадлежать тому же департаменту, что и проект");
                }
            }

            project.setPm(pm);
        }

        return projectRepository.save(project);
    }

    public void delete(Long id) {
        projectRepository.deleteById(id);
    }

    // ─── DTO обёртки ─────────────────────────────────────────────────────────

    public List<ProjectResponse> getAllAsResponse(String email) {
        return getAll(email).stream().map(this::toProjectResponse).toList();
    }

    public ProjectResponse getByIdAsResponse(Long id, String email) {
        return toProjectResponse(getById(id, email));
    }

    public ProjectResponse createAsResponse(ProjectRequest request, String email) {
        return toProjectResponse(create(request, email));
    }

    public ProjectResponse updateAsResponse(Long id, ProjectRequest request, String email) {
        return toProjectResponse(update(id, request, email));
    }

    private ProjectResponse toProjectResponse(Project p) {
        ProjectResponse r = new ProjectResponse();
        r.setId(p.getId());
        r.setName(p.getName());
        r.setDescription(p.getDescription());
        r.setStatus(p.getStatus() != null ? p.getStatus().name() : null);

        if (p.getPm() != null) {
            r.setPmId(p.getPm().getId());
            r.setPmName(p.getPm().getFullName());
        }

        if (p.getDepartment() != null) {
            r.setDepartmentId(p.getDepartment().getId());
            r.setDepartmentName(p.getDepartment().getName());
        }

        if (p.getMembers() != null) {
            r.setMemberIds(p.getMembers().stream()
                    .map(m -> m.getUser().getId()).toList());
            r.setMemberNames(p.getMembers().stream()
                    .map(m -> m.getUser().getFullName()).toList());
        } else {
            r.setMemberIds(Collections.emptyList());
            r.setMemberNames(Collections.emptyList());
        }

        r.setTaskCount((int) taskRepository.countByProjectId(p.getId()));
        return r;
    }
}
