package com.blur.profileservice.controller;

import com.blur.profileservice.dto.request.ProfileCreationRequest;
import com.blur.profileservice.dto.request.UserProfileUpdateRequest;
import com.blur.profileservice.dto.response.ApiResponse;
import com.blur.profileservice.dto.response.UserProfileResponse;
import com.blur.profileservice.entity.UserProfile;
import com.blur.profileservice.exception.AppException;
import com.blur.profileservice.exception.ErrorCode;
import com.blur.profileservice.mapper.UserProfileMapper;
import com.blur.profileservice.repository.UserProfileRepository;
import com.blur.profileservice.service.UserProfileService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class InternalUserProfileController {
    UserProfileService userProfileService;
    @PostMapping("/internal/users")
    public ApiResponse<UserProfileResponse> createProfile(@RequestBody ProfileCreationRequest request){
        var result = userProfileService.createProfile(request);
        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .result(result)
                .build();
    }
}
