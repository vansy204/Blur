package org.blurbackend.dto;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.enums.Role;
import org.blurbackend.enums.UserStatus;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserDto {
    Integer id;
    String username;
    String email;
    String name;
    String userImage;
    Role role;
    UserStatus status;

}
