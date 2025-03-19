package com.blur.profileservice.controller;

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
import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)

public class UserProfileController {
    UserProfileService userProfileService;
    UserProfileMapper userProfileMapper;
    private final UserProfileRepository userProfileRepository;

    @GetMapping("/users/{profileId}")
    public ApiResponse<UserProfileResponse> getProfile(@PathVariable String profileId){
        var result = userProfileMapper.toUserProfileResponse(userProfileService.getUserProfile(profileId));
        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .result(result)
                .build();
    }
    @GetMapping("/users/")
    public ApiResponse<List<UserProfileResponse>> getUserProfiles(){
        var result = userProfileService.getAllUserProfiles();
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(1000)
                .result(result)
                .build();
    }
    @PutMapping("/users/{userProfileId}")
    public ApiResponse<UserProfileResponse> updateUserProfile(@PathVariable String userProfileId, @RequestBody UserProfileUpdateRequest request){
        var profileUpdated = userProfileService.updateUserProfile(userProfileId, request);
        return ApiResponse.<UserProfileResponse>builder()
                .code(1000)
                .result(userProfileMapper.toUserProfileResponse(profileUpdated))
                .build();
    }
    @DeleteMapping("/users/{userProfileId}")
    public ApiResponse<String> deleteUserProfile(@PathVariable String userProfileId){
        userProfileService.deleteUserProfile(userProfileId);
        return ApiResponse.<String>builder()
                .code(1000)
                .result("User Profile has been deleted")
                .build();
    }
    @GetMapping("/users/myInfo")
    public ApiResponse<UserProfileResponse> myInfo(){
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.myProfile())
                .build();
    }

    @PutMapping("/users/follow/{userId}")
    public ApiResponse<String> followUser(@PathVariable String userId){
        return ApiResponse.<String>builder()
                .result(userProfileService.followUser(userId))
                .build();
    }
    @PutMapping("/users/unfollow/{userId}")
    public ApiResponse<String> unfollowUser(@PathVariable String userId){
        return ApiResponse.<String>builder()
                .result(userProfileService.unfollowUser(userId))
                .build();
    }

}
