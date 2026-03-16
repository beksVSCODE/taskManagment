package com.example.demo.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeTaskDTO {
    private Long id;
    private String title;
    private String project;
    private String priority;
    private String status;
    private LocalDate deadline;
    private boolean isOverdue;
}
