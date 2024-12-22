package com.blur.profileservice.mapper;

import com.blur.profileservice.dto.request.ProfileCreationRequest;
import com.blur.profileservice.dto.request.UserProfileUpdateRequest;
import com.blur.profileservice.dto.response.UserProfileResponse;
import com.blur.profileservice.entity.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    UserProfile toUserProfile(ProfileCreationRequest profileCreationRequest);
    UserProfileResponse toUserProfileResponse(UserProfile userProfile);
    void updateUserProfile(@MappingTarget UserProfile userProfile,UserProfileUpdateRequest userProfileUpdateRequest);
}
