package com.blur.profileservice.dto.response;

import com.blur.profileservice.entity.UserProfile;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileResponse {
    String id;
    String userId;
    String firstName;
    String lastName;
    LocalDate dob;
    LocalDate createdAt;
    Set<UserProfile> follower;
    Set<UserProfile> following;
}
