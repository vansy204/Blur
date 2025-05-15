package com.blur.profileservice.service;

import com.blur.profileservice.dto.event.FollowEvent;
import com.blur.profileservice.dto.request.ProfileCreationRequest;
import com.blur.profileservice.dto.request.UserProfileUpdateRequest;
import com.blur.profileservice.dto.response.UserProfileResponse;
import com.blur.profileservice.entity.UserProfile;
import com.blur.profileservice.exception.AppException;
import com.blur.profileservice.exception.ErrorCode;
import com.blur.profileservice.mapper.UserProfileMapper;
import com.blur.profileservice.repository.UserProfileRepository;
import com.blur.profileservice.repository.httpclient.NotificationClient;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;
    NotificationClient notificationClient;

    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        UserProfile userProfile = userProfileMapper.toUserProfile(request);
        userProfile.setCreatedAt(LocalDate.now());
        userProfile.setEmail(request.getEmail());
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
        return userProfileRepository.findAllByFirstNameContainingIgnoreCase(firstName)
                .stream()
                .map(userProfileMapper::toUserProfileResponse)
                .toList();

    }
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllUserProfiles() {
        return userProfileRepository.findAll()
                .stream()
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }

    public UserProfileResponse getByUserId(String userId) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXIST));
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse myProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

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
        String reqUserId = authentication.getName();

        if (reqUserId.equals(followerId)) {
            throw new AppException(ErrorCode.CANNOT_FOLLOW_YOURSELF);
        }

        // Lấy Neo4j UUID từ userId
        var requester = userProfileRepository.findUserProfileByUserId(reqUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

        var followingUser = userProfileRepository.findUserProfileById(followerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
        userProfileRepository.follow(requester.getId(), followerId);
        log.info("following: {}" , followingUser);

        // gui notification
        FollowEvent event = FollowEvent.builder()
                .senderId(requester.getId())
                .senderName(requester.getFirstName() + " " + requester.getLastName())
                .receiverId(followingUser.getId())
                .receiverName(followingUser.getFirstName() + " " + followingUser.getLastName())
                .receiverEmail(followingUser.getEmail())
                .timestamp(LocalDateTime.now())
                .build();
        log.info("Sending follow event: {}", event);
        notificationClient.sendFollowNotification(event);


        return "You are following " + followingUser.getFirstName();
    }

    public String unfollowUser(String followerId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String reqUserId = authentication.getName();

        var requester = userProfileRepository.findUserProfileByUserId(reqUserId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));

        var followingUser = userProfileRepository.findUserProfileById(followerId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
        requester.getFollowers().remove(followingUser);
        userProfileRepository.unfollow(requester.getId(), followerId);

        return "You unfollowed " + followingUser.getFirstName();
    }
    public List<UserProfileResponse> getFollowers(String profileId) {
        return userProfileRepository.findAllFollowersById(profileId)
                .stream()
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }
    public List<UserProfileResponse> getFollowing(String profileId) {
        return userProfileRepository.findAllFollowingById(profileId)
                .stream()
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }



}
