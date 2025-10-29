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

    public PostResponse createPost(PostRequest postRequest) {
        // lay thong tin cua user tu token
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
    /*
    public List<PostResponse> getAllPosts() {
        List<Post> posts = postRepository.findAllByOrderByCreatedAtDesc();
        return posts.stream().map(post -> {
            String userName = "Unknown";
            String userImageUrl = null;
            String profileId = null;
            try {
                ApiResponse<UserProfileResponse> response = profileClient.getProfile(post.getUserId());
                UserProfileResponse userProfile = response.getResult();

                if (userProfile != null) {
                    userName = userProfile.getFirstName() + " " + userProfile.getLastName();
                    userImageUrl = userProfile.getImageUrl();
                    profileId = userProfile.getId();
                }
            } catch (Exception e) {
                System.out.println("Không lấy được profile cho userId: " + post.getUserId());
            }

            return PostResponse.builder()
                    .id(post.getId())
                    .userId(post.getUserId())
                    .profileId(profileId)
                    .userName(userName)
                    .userImageUrl(userImageUrl)  // ✅ Truyền vào response
                    .content(post.getContent())
                    .mediaUrls(post.getMediaUrls())
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }
    */

    public Page<PostResponse> getAllPots(int page, int limit) {
        Pageable pageable = PageRequest.of(page -1 , limit, Sort.by("createdAt").descending());
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<PostResponse> responses = postPage.getContent().stream().map(post -> {
            String userName = "Unknown";
            String userImageUrl = null;
            String profileId = null;

            try{
                ApiResponse<UserProfileResponse> response = profileClient.getProfile(post.getUserId());
                UserProfileResponse userProfileResponse = response.getResult();

                if (userProfileResponse != null) {
                    userName = userProfileResponse.getFirstName() + " " + userProfileResponse.getLastName();
                    userImageUrl = userProfileResponse.getImageUrl();
                    profileId = userProfileResponse.getId();
                }
            } catch (Exception e) {
                System.out.println("Không lấy được profile cho userId: " + post.getUserId());
            }

            return PostResponse.builder()
                    .id(post.getId())
                    .userId(post.getUserId())
                    .profileId(profileId)
                    .userName(userName)
                    .userImageUrl(userImageUrl)  // ✅ Truyền vào response
                    .content(post.getContent())
                    .mediaUrls(post.getMediaUrls())
                    .createdAt(post.getCreatedAt())
                    .updatedAt(post.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
        return new PageImpl<>(responses, pageable, postPage.getTotalElements());
    }

    public List<PostResponse> getMyPosts() {
        // lay thong tin cua user tu token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        UserProfileResponse userProfile = null;
        try {
            userProfile = profileClient.getProfile(userId).getResult();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return postRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(postMapper::toPostResponse)
                .collect(Collectors.toList());
    }

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
                .orElseThrow(()->new AppException(ErrorCode.POST_NOT_FOUND));

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
    public String unlikePost(String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        postLikeRepository.deleteByPostIdAndUserId(postId, userId);
        return "unlike";

    }
    public List<PostLike> getPostLikesByPostId(String postId) {
        return postLikeRepository.findAllByPostId(postId);
    }

    public List<PostResponse> getPostsByUserId(String userId) {
        return postRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(postMapper::toPostResponse)
                .collect(Collectors.toList());
    }
}
