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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    UserProfileMapper userProfileMapper;


    public UserProfileResponse createProfile(ProfileCreationRequest request){
        UserProfile  userProfile = userProfileMapper.toUserProfile(request);

        try{
            userProfile = userProfileRepository.save(userProfile);
        }catch (DataIntegrityViolationException ex){
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfile getUserProfile(String id){
        return userProfileRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_PROFILE_NOT_FOUND));
    }
    public List<UserProfileResponse> getAllUserProfiles(){
        return userProfileRepository.findAll().stream().map(userProfileMapper::toUserProfileResponse).collect(Collectors.toList());
    }
    public UserProfile updateUserProfile(String userProfileId, UserProfileUpdateRequest request){
        UserProfile userProfile = getUserProfile(userProfileId);
        userProfileMapper.updateUserProfile(userProfile, request);
        return userProfileRepository.save(userProfile);
    }
    public void deleteUserProfile(String userProfileId){
        userProfileRepository.deleteById(userProfileId);
    }
//    public UserProfileResponse getMyProfile(){
//        var context = SecurityContextHolder.getContext();
//    }
}
