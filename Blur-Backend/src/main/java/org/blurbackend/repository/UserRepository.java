package org.blurbackend.repository;

import org.blurbackend.enums.Role;
import org.blurbackend.enums.UserStatus;
import org.blurbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    public Optional<User> findByEmail(String email);

    public Optional<User> findByUserName(String userName);

    @Query("SELECT u FROM User u where u.id in :users")
    public List<User> findAllUsersByUserIds(@Param(("users")) List<Integer> userIds);

    @Query("SELECT DISTINCT u FROM User u WHERE u.userName LIKE %:query% OR u.email LIKE %:query%")
    public List<User> findByQuery(@Param("query") String query);

    public List<User> findByRole(Role role);
    public List<User> findByStatus(UserStatus status);
}

