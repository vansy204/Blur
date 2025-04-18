package org.identityservice.service;

import java.util.HashSet;
import java.util.List;

import org.identityservice.dto.request.UserCreationPasswordRequest;
import org.identityservice.dto.request.UserCreationRequest;
import org.identityservice.dto.request.UserUpdateRequest;
import org.identityservice.dto.response.UserResponse;
import org.identityservice.entity.Role;
import org.identityservice.entity.User;
import org.identityservice.exception.AppException;
import org.identityservice.exception.ErrorCode;
import org.identityservice.mapper.ProfileMapper;
import org.identityservice.mapper.UserMapper;
import org.identityservice.repository.RoleRepository;
import org.identityservice.repository.UserRepository;
import org.identityservice.repository.httpclient.ProfileClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    ProfileMapper profileMapper;
    RoleRepository roleRepository;

    public UserResponse createUser(UserCreationRequest request) {
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        HashSet<Role> roles = new HashSet<>();
        roleRepository.findById("USER").ifPresent(roles::add);
        user.setRoles(roles);
        user.setEmailVerified(false);
        try {
            userRepository.save(user);

        } catch (DataIntegrityViolationException ex) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }
        // tao profile tu user da nhan
        var profileResponse = profileMapper.toProfileCreationRequest(request);
        // mapping userid tu user vao profile
        profileResponse.setUserId(user.getId());
        profileClient.createProfile(profileResponse);
        // build notification event

        return userMapper.toUserResponse(user);
    }

    public void createPassword(UserCreationPasswordRequest request) {
        var context = SecurityContextHolder.getContext();
        String username = context.getAuthentication().getName();
        User user =
                userRepository.findByUsername(username)
                        .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (!StringUtils.hasText(request.getPassword())) {
            throw new AppException(ErrorCode.PASSWORD_EXISTED);
        }
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("Getting users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PostAuthorize("returnObject.username == authentication.name")
    public User getUserById(String userId) {
        return userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_EXISTED));
    }

    public User updateUser(String userId, UserUpdateRequest request) {
        User user = getUserById(userId);
        userMapper.updateUser(user, request);
        return userRepository.save(user);
    }

    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String name = context.getAuthentication().getName();
        User user = userRepository.findByUsername(name).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        var userResponse = userMapper.toUserResponse(user);
        userResponse.setNoPassword(!StringUtils.hasText(user.getPassword()));
        return userResponse;
    }
}
