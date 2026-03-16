package com.example.demo.repositories;

import com.example.demo.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByManagerId(Long managerId);
    Optional<Department> findFirstByManagerId(Long managerId);
    java.util.List<Department> findAllByManagerId(Long managerId);
}