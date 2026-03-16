package com.example.demo.dto.record;


import java.time.LocalDate;
import java.util.List;

public record TaskUpdateDto(
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        Integer estimate,
        Long assigneeId,
        List<String> tags
) {}