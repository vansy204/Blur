package com.postservice.service;

import com.postservice.dto.event.Event;
import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.Comment;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentRepository;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.Instant;
import java.time.LocalDateTime;
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
    IdentityClient identityClient;
    NotificationClient notificationClient;
    PostRepository postRepository;



    @CacheEvict(value = "comments", key = "#postId")
    public CommentResponse createComment(CreateCommentRequest request, String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var user = profileClient.getProfile(userId);
        var comment = Comment.builder()
                .content(request.getContent())
                .userId(userId)
                .firstName(user.getResult().getFirstName())
                .lastName(user.getResult().getLastName())
                .postId(postId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        comment = commentRepository.save(comment);
        var post = postRepository.findById(postId).orElseThrow(()->new AppException(ErrorCode.POST_NOT_FOUND));
        var sender = identityClient.getUser(userId);
        var receiver = identityClient.getUser(post.getUserId());
        Event event = Event.builder()
                .postId(post.getId())
                .senderName(sender.getResult().getUsername())
                .senderId(sender.getResult().getId())
                .receiverEmail(receiver.getResult().getEmail())
                .receiverId(receiver.getResult().getId())
                .receiverName(user.getResult().getFirstName() + " " + user.getResult().getLastName())
                .timestamp(LocalDateTime.now())
                .build();
        notificationClient.sendCommentNotification(event);
        return commentMapper.toCommentResponse(comment);
    }


    @Cacheable(
            value = "comments",
            key = "#postId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CommentResponse> getAllCommentByPostId(String postId) {
        return commentRepository.findAllByPostId(postId).stream().map(commentMapper::toCommentResponse).collect(Collectors.toList());
    }

    public CommentResponse getCommentById(String commentId) {
        return commentMapper.toCommentResponse(commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND)));
    }

    @CacheEvict(value = "comments", key = "#root.target.getPostIdByCommentId(#commentId)")
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

    @CacheEvict(value = "comments", key = "#root.target.getPostIdByCommentId(#commentId)")
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

    public String getPostIdByCommentId(String commentId) {
        return commentRepository.findById(commentId)
                .map(Comment::getPostId)
                .orElse(null);
    }
}
