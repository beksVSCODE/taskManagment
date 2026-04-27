package com.example.demo.dto.request;

import com.example.demo.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class SubtaskRequest {

    @NotBlank(message = "Название подзадачи обязательно")
    private String title;

    // Поддержка нескольких исполнителей
    // Если передан assigneeId (старый формат), используется для совместимости
    // Если передано assigneeIds (новый формат), используется это
    private Long assigneeId;
    
    // Опционально - если не передано, будет использовано assigneeId
    private List<Long> assigneeIds;

    private TaskStatus status = TaskStatus.NEW;

    @NotNull(message = "Срок выполнения обязателен")
    private LocalDate dueDate;
}
