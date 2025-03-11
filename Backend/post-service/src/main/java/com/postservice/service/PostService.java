package com.postservice.service;

import com.postservice.dto.request.PostRequest;

import com.postservice.dto.response.PostResponse;
import com.postservice.dto.response.UserProfileResponse;
import com.postservice.entity.Post;
import com.postservice.entity.PostLike;
import com.postservice.mapper.PostMapper;
import com.postservice.repository.PostLikeRepository;
import com.postservice.repository.PostRepository;
import com.postservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
    PostRepository postRepository;
    PostMapper postMapper;
    ProfileClient profileClient;
    PostLikeRepository postLikeRepository;
    public PostResponse createPost(PostRequest postRequest) {
        // lay thong tin cua user tu token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Post post = Post.builder()
                .content(postRequest.getContent())
                .userId(authentication.getName())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        post = postRepository.save(post);
        return postMapper.toPostResponse(post);
    }

    public List<PostResponse> getMyPosts() {
        // lay thong tin cua user tu token
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        UserProfileResponse userProfile = null;
        try{
            profileClient.getProfile(userId).getResult();
        }catch (Exception e){
            e.printStackTrace();
        }
        return postRepository.findAllByUserId(userId).stream().map(postMapper::toPostResponse).collect(Collectors.toList());
    }

    public String likePost(String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        if(postLikeRepository.existsByPostIdAndUserId(postId, userId)){
            postLikeRepository.deleteByPostIdAndUserId(postId, userId);
            return "unlike";
        }
        postLikeRepository.save(PostLike.builder().postId(postId).userId(userId).build());
        return "like";
    }

}
