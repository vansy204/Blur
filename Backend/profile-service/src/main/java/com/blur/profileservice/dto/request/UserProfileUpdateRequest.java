package com.blur.profileservice.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileUpdateRequest {
    String firstName;
    String lastName;
    String bio;
    String city;
    String phone;
    String email;
    String gender;
    String website;
    String imageUrl;
   String address;
    String dob;
}

