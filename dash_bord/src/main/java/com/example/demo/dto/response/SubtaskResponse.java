package com.example.demo.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class SubtaskResponse {
    private Long id;
    private String title;
    private String status;
    private LocalDate dueDate;

    private Long taskId;

    // Для совместимости со старым клиентом
    private Long assigneeId;
    private String assigneeName;

    // Новые поля: несколько исполнителей
    private List<Long> assigneeIds;
    private List<String> assigneeNames;
    
    // Информация о выполнении для каждого исполнителя
    private List<AssigneeStatus> assigneeStatuses;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // DTO для статуса выполнения подзадачи каждым исполнителем
    @Data
    public static class AssigneeStatus {
        private Long assigneeId;
        private String assigneeName;
        private Boolean isCompleted;
        private LocalDateTime completedAt;
    }
}
