package com.example.demo.repositories;

import com.example.demo.entity.User;
import com.example.demo.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
                SELECT u FROM User u
                WHERE (:query IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', CAST(:query AS string), '%'))
                                      OR LOWER(u.email)    LIKE LOWER(CONCAT('%', CAST(:query AS string), '%')))
                AND   (:role  IS NULL OR u.role = :role)
                AND   (:deptId IS NULL OR u.department.id = :deptId)
            """)
    List<User> searchUsers(
            @Param("query") String query,
            @Param("role") Role role,
            @Param("deptId") Long deptId);

    List<User> findByDepartmentId(Long id);

    @Query("""
            SELECT DISTINCT u
            FROM User u
            LEFT JOIN FETCH u.department
            WHERE u.isActive = true
            """)
    List<User> findAllActiveWithDepartment();

    @Query("""
            SELECT DISTINCT u
            FROM User u
            LEFT JOIN FETCH u.department
            WHERE u.id IN :ids
              AND u.isActive = true
            """)
    List<User> findActiveByIdsWithDepartment(@Param("ids") List<Long> ids);

    @Query("""
            SELECT DISTINCT u
            FROM User u
            LEFT JOIN FETCH u.department
            WHERE u.department.id = :departmentId
              AND u.isActive = true
            """)
    List<User> findActiveByDepartmentIdWithDepartment(@Param("departmentId") Long departmentId);

}
