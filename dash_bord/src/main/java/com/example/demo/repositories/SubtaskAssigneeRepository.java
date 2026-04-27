package com.example.demo.repositories;

import com.example.demo.entity.SubtaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubtaskAssigneeRepository extends JpaRepository<SubtaskAssignee, Long> {
    List<SubtaskAssignee> findBySubtaskId(Long subtaskId);
    
    Optional<SubtaskAssignee> findBySubtaskIdAndAssigneeId(Long subtaskId, Long assigneeId);
    
    void deleteBySubtaskIdAndAssigneeId(Long subtaskId, Long assigneeId);
}
