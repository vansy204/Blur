package com.postservice.controller;

import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.ApiResponse;
import com.postservice.dto.response.CommentResponse;
import com.postservice.service.CommentService;
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
public class CommentController {
    CommentService commentService;

    @PostMapping("/{postId}/create")
    public ApiResponse<CommentResponse> createComment(@PathVariable String postId, @RequestBody CreateCommentRequest comment) {
        return ApiResponse.<CommentResponse>builder()
                .result(commentService.createComment(comment, postId))
                .build();
    }
    @GetMapping("/{postId}/comments")
    public ApiResponse<List<CommentResponse>> getAllComments(@PathVariable String postId) {
        return ApiResponse.<List<CommentResponse>>builder()
                .result(commentService.getAllCommentByPostId(postId))
                .build();
    }
}
