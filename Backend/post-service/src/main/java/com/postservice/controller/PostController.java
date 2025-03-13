package com.postservice.controller;

import com.postservice.dto.request.PostRequest;
import com.postservice.dto.response.ApiResponse;
import com.postservice.dto.response.PostResponse;
import com.postservice.service.PostService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostController {
    PostService postService;

    @PostMapping("/create")
    public ApiResponse<PostResponse> createPost(@RequestBody PostRequest post) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.createPost(post))
                .build();
    }

    @GetMapping("/my-posts")
    public ApiResponse<List<PostResponse>> getMyPosts() {
        return ApiResponse.<List<PostResponse>>builder()
                .result(postService.getMyPosts())
                .build();
    }

    @PutMapping("/{postId}/like")
    public ApiResponse<String> likePost(@PathVariable String postId) {
        return ApiResponse.<String>builder()
                .result(postService.likePost(postId))
                .build();
    }

    @PutMapping("/{postId}/update")
    public ApiResponse<PostResponse> updatePost(@PathVariable String postId,
                                                @RequestBody PostRequest post) {
        return ApiResponse.<PostResponse>builder()
                .result(postService.updatePost(postId, post))
                .build();
    }

    @DeleteMapping("/{postId}/delete")
    public ApiResponse<String> deletePost(@PathVariable String postId) {
        return ApiResponse.<String>builder()
                .result(postService.deletePost(postId))
                .build();
    }
}
