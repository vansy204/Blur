package org.identityservice.entity;

import java.time.LocalDate;
import java.util.Set;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(
            name = "username",
            unique = true,
            columnDefinition =
                    "VARCHAR(255) COLLATE utf8mb4_unicode_ci") // đánh dấu unique và không phân biệt chữ hoa thường
    String username;

    String password;
    String firstName;
    String lastName;
    LocalDate dob;

    @ManyToMany
    Set<Role> roles;
}
