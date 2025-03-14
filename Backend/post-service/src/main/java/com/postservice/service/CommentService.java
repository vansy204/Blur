package com.postservice.service;

import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.Comment;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentRepository;
import com.postservice.repository.PostRepository;
import com.postservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentService {
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    ProfileClient profileClient;

    public CommentResponse createComment(CreateCommentRequest request, String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var user = profileClient.getProfile(userId);
        var comment = Comment.builder()
                .content(request.getContent())
                .userId(userId)
                .userName(user.getResult().getFirstName())
                .postId(postId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        log.info("Comment created user {}", user.getResult().getFirstName());
        comment = commentRepository.save(comment);

        return commentMapper.toCommentResponse(comment);
    }

    public List<CommentResponse> getAllCommentByPostId(String postId) {
        return commentRepository.findAllByPostId(postId).stream().map(commentMapper::toCommentResponse).collect(Collectors.toList());
    }

    public CommentResponse getCommentById(String commentId) {
        return commentMapper.toCommentResponse(commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND)));
    }

    public CommentResponse updateComment(String commentId, CreateCommentRequest request) {

        var comment = commentRepository.findById(commentId).
                orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        comment.setContent(request.getContent());
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
        return commentMapper.toCommentResponse(comment);
    }

    public String deleteComment(String commentId) {
        var comment = commentRepository.findById(commentId).
                orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        commentRepository.deleteById(comment.getId());
        return "Comment deleted";
    }
}
