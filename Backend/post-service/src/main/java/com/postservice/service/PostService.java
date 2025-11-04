package com.postservice.service;

import com.postservice.dto.event.Event;
import com.postservice.dto.request.PostRequest;
import com.postservice.dto.response.ApiResponse;
import com.postservice.dto.response.PostResponse;
import com.postservice.dto.response.UserProfileResponse;
import com.postservice.entity.Post;
import com.postservice.entity.PostLike;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.PostMapper;
import com.postservice.repository.PostLikeRepository;
import com.postservice.repository.PostRepository;
import com.postservice.repository.httpclient.IdentityClient;
import com.postservice.repository.httpclient.NotificationClient;
import com.postservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
    PostRepository postRepository;
    PostMapper postMapper;
    ProfileClient profileClient;
    PostLikeRepository postLikeRepository;
    NotificationClient notificationClient;
    IdentityClient identityClient;

    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true),
            @CacheEvict(value = "postsByUser", key = "#root.target.getCurrentUserId()")
    })
    public PostResponse createPost(PostRequest postRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var profile = profileClient.getProfile(userId);

        Post post = Post.builder()
                .content(postRequest.getContent())
                .mediaUrls(postRequest.getMediaUrls())
                .userId(userId)
                .firstName(profile.getResult().getFirstName())
                .lastName(profile.getResult().getLastName())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        post = postRepository.save(post);

        return postMapper.toPostResponse(post);
    }

    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true),
            @CacheEvict(value = "postsByUser", key = "#root.target.getCurrentUserId()")
    })
    public PostResponse updatePost(String postId, PostRequest postRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        var userId = authentication.getName();
        if (!post.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        post.setContent(postRequest.getContent());
        post.setMediaUrls(postRequest.getMediaUrls());
        post.setUpdatedAt(Instant.now());
        post = postRepository.save(post);

        return postMapper.toPostResponse(post);
    }


    @Caching(evict = {
            @CacheEvict(value = "posts", allEntries = true),
            @CacheEvict(value = "postsByUser", key = "#root.target.getCurrentUserId()"),
            @CacheEvict(value = "postLikes", key = "#postId"),
            @CacheEvict(value = "comments", key = "#postId")
    })
    public String deletePost(String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        var userId = authentication.getName();
        if (!post.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        postRepository.deleteById(postId);

        return "Post deleted successfully";
    }

    public Page<PostResponse> getAllPots(int page, int limit) {

        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<PostResponse> responses = postPage.getContent().stream().map(post -> {
            String userName = "Unknown";
            String userImageUrl = null;
            String profileId = null;

            try {
                ApiResponse<UserProfileResponse> response = profileClient.getProfile(post.getUserId());
                UserProfileResponse userProfileResponse = response.getResult();

                if (userProfileResponse != null) {
                    userName = userProfileResponse.getFirstName() + " " + userProfileResponse.getLastName();
                    userImageUrl = userProfileResponse.getImageUrl();
                    profileId = userProfileResponse.getId();
                }
            } catch (Exception e) {
                log.error("Failed to fetch profile for userId: {}", post.getUserId(), e);
            }

            return PostResponse.builder()
                    .id(post.getId())
                    .userId(post.getUserId())
                    .profileId(profileId)
                    .userName(userName)
                    .userImageUrl(userImageUrl)
                    .content(post.getContent())
                    .mediaUrls(post.getMediaUrls())
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(responses, pageable, postPage.getTotalElements());
    }


    @Cacheable(
            value = "postsByUser",
            key = "#root.target.getCurrentUserId()",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<PostResponse> getMyPosts() {
        String userId = getCurrentUserId();

        return postRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(postMapper::toPostResponse)
                .collect(Collectors.toList());
    }


    @Cacheable(
            value = "postsByUser",
            key = "#userId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<PostResponse> getPostsByUserId(String userId) {

        return postRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(postMapper::toPostResponse)
                .collect(Collectors.toList());
    }


    @CacheEvict(value = "postLikes", key = "#postId")
    public String likePost(String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        PostLike postLike = PostLike.builder()
                .postId(postId)
                .userId(userId)
                .createdAt(Instant.now())
                .build();
        postLikeRepository.save(postLike);

        Post postResponse = postRepository.findById(postLike.getPostId())
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));

        var sender = identityClient.getUser(postLike.getUserId());
        var receiver = identityClient.getUser(postResponse.getUserId());

        Event event = Event.builder()
                .senderId(sender.getResult().getId())
                .senderName(sender.getResult().getUsername())
                .receiverId(receiver.getResult().getId())
                .receiverName(receiver.getResult().getUsername())
                .receiverEmail(receiver.getResult().getEmail())
                .timestamp(LocalDateTime.now())
                .build();

        log.info("Sending like post event: {}", event);
        notificationClient.sendLikePostNotification(event);

        return "like";
    }


    @CacheEvict(value = "postLikes", key = "#postId")
    public String unlikePost(String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        postLikeRepository.deleteByPostIdAndUserId(postId, userId);

        log.info("Post {} unliked by user {}", postId, userId);
        return "unlike";
    }

    @Cacheable(
            value = "postLikes",
            key = "#postId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<PostLike> getPostLikesByPostId(String postId) {
        log.info("Fetching post likes from DB for postId: {} (CACHE MISS)", postId);
        return postLikeRepository.findAllByPostId(postId);
    }

    public String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}