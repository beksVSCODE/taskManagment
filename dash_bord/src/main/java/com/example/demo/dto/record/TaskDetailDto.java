package com.example.demo.dto.record;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record TaskDetailDto(
        Long id,
        String title,
        String description,
        String status,
        String priority,
        LocalDate dueDate,
        Integer estimate,          // если есть
        UserShortDto assignee,
        ProjectDto project,
        List<String> tags,
        List<SubtaskDto> subtasks,
        OffsetDateTime createdAt
) {}