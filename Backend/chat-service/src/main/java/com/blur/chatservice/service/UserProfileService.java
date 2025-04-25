package com.blur.chatservice.service;

import com.blur.chatservice.dto.ApiResponse;
import com.blur.chatservice.dto.response.UserProfileResponse;
import com.blur.chatservice.exception.AppException;
import com.blur.chatservice.exception.ErrorCode;
import com.blur.chatservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    ProfileClient profileClient;

    // thay thong tin nguoi dung hien tai
    public UserProfileResponse getCurrentUserProfile() {

        String userId = getCurrentUserId();
        log.info("Fetching user profile for userId: {}", userId);

        return getUserProfileByUserId(userId);
    }

    private UserProfileResponse getUserProfileByUserId(String userId) {
        ApiResponse<UserProfileResponse> response = profileClient.getProfile(userId);
        if (response.getCode() != 1000) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }
        return response.getResult();
    }

    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        throw new AppException(ErrorCode.USER_NOT_AUTHENTICATED);
    }
    public UserProfileResponse getUserProfileByProfileId(String profileId) {
        ApiResponse<UserProfileResponse> response = profileClient.getProfileById(profileId);
        return response.getResult();
    }
}
