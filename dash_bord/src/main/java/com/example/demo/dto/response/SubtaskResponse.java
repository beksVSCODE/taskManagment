package com.example.demo.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SubtaskResponse {
    private Long id;
    private String title;
    private String status;
    private LocalDate dueDate;

    private Long taskId;

    private Long assigneeId;
    private String assigneeName;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}