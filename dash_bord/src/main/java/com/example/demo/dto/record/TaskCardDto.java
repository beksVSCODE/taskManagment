package com.example.demo.dto.record;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record TaskCardDto(
        Long id,
        String title,
        String status,
        String priority,
        LocalDate dueDate,
        UserShortDto assignee,
        List<String> tags
) {}