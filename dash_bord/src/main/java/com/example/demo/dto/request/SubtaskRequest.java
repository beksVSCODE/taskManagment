package com.example.demo.dto.request;

import com.example.demo.enums.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class SubtaskRequest {

    @NotBlank(message = "Название подзадачи обязательно")
    private String title;

    @NotNull(message = "Исполнитель подзадачи обязателен")
    private Long assigneeId;

    private TaskStatus status = TaskStatus.NEW;

    @NotNull(message = "Срок выполнения обязателен")
    private LocalDate dueDate;
}