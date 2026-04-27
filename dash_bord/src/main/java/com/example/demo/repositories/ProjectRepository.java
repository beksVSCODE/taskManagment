package com.example.demo.repositories;

import com.example.demo.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    @EntityGraph(attributePaths = {"members", "members.user"})
    @Query("SELECT p FROM Project p")
    List<Project> findAll();
    
    @EntityGraph(attributePaths = {"members", "members.user"})
    Optional<Project> findById(Long id);
    
    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Project> findByDepartmentId(Long departmentId);
    
    @EntityGraph(attributePaths = {"members", "members.user"})
    List<Project> findByPmId(Long pmId);

    @EntityGraph(attributePaths = {"members", "members.user"})
    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.user.id = :userId")
    List<Project> findByMemberId(Long userId);
    
    @EntityGraph(attributePaths = {"members", "members.user"})
    @Query("SELECT p FROM Project p JOIN p.members m WHERE m.user.id = :userId")
    List<Project> findByMemberUserId(@Param("userId") Long userId);

}