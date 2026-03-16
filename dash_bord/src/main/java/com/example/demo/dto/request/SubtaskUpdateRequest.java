package com.example.demo.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class SubtaskUpdateRequest {
    private String title;
    private Long assigneeId;
    private LocalDate dueDate;
}