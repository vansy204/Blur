package com.blur.profileservice.service;

import com.blur.profileservice.dto.request.ProfileCreationRequest;
import com.blur.profileservice.dto.request.UserProfileUpdateRequest;
import com.blur.profileservice.dto.response.UserProfileResponse;
import com.blur.profileservice.entity.UserProfile;
import com.blur.profileservice.exception.AppException;
import com.blur.profileservice.exception.ErrorCode;
import com.blur.profileservice.mapper.UserProfileMapper;
import com.blur.profileservice.repository.UserProfileRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.User;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;


    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        UserProfile userProfile = userProfileMapper.toUserProfile(request);
        userProfile.setCreatedAt(LocalDate.now());
        try {
            userProfile = userProfileRepository.save(userProfile);
        } catch (DataIntegrityViolationException ex) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfile getUserProfile(String id) {
        return userProfileRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
    }
    public List<UserProfileResponse> findUserProfileByFirstName(String firstName) {
        return userProfileRepository.findAllByFirstNameContainingIgnoreCase(firstName).stream().map(userProfileMapper::toUserProfileResponse).toList();

    }
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllUserProfiles() {
        return userProfileRepository.findAll().stream().map(userProfileMapper::toUserProfileResponse).toList();
    }

    public UserProfileResponse getByUserId(String userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse myProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName(); // retrieved from jwt
        log.info("UserProfileService myProfile profileId: {}", userId);
        UserProfile userProfile = userProfileRepository.findByUserId(userId).orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfile updateUserProfile(String userProfileId, UserProfileUpdateRequest request) {
        UserProfile userProfile = getUserProfile(userProfileId);
        userProfileMapper.updateUserProfile(userProfile, request);
        return userProfileRepository.save(userProfile);
    }

    public void deleteUserProfile(String userProfileId) {
        userProfileRepository.deleteById(userProfileId);
    }

    public String followUser(String followerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var reqUserId = authentication.getName();

        if (reqUserId.equals(followerId)) {
            throw new AppException(ErrorCode.CANNOT_FOLLOW_YOURSELF);
        }

        userProfileRepository.follow(reqUserId, followerId);


        var followingUser = userProfileRepository.findUserProfileByUserId(followerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

        return "You are following " + followingUser.getFirstName();
    }

    public String unfollowUser(String followerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String reqUserId = authentication.getName();

        // Optional: Kiểm tra người cần unfollow có tồn tại không
        var followingUser = userProfileRepository.findUserProfileByUserId(followerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

        // Gọi Cypher query để xóa quan hệ follows
        userProfileRepository.unfollow(reqUserId, followerId);

        return "You unfollowed " + followingUser.getFirstName();
    }


}
