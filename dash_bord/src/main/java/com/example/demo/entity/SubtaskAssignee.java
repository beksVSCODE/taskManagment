package com.example.demo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "subtask_assignees")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SubtaskAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subtask_id", nullable = false)
    private Subtask subtask;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assignee_id", nullable = false)
    private User assignee;

    // Статус выполнения подзадачи для этого конкретного исполнителя
    @Column(name = "is_completed", nullable = false)
    private Boolean isCompleted = false;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
