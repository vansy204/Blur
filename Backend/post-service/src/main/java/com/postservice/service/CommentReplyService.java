package com.postservice.service;

import com.postservice.dto.event.Event;
import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.CommentReply;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentReplyRepository;
import com.postservice.repository.CommentRepository;
import com.postservice.repository.PostRepository;
import com.postservice.repository.httpclient.IdentityClient;
import com.postservice.repository.httpclient.NotificationClient;
import com.postservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Builder
@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentReplyService {
    CommentReplyRepository commentReplyRepository;
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    ProfileClient profileClient;
    IdentityClient identityClient;
    NotificationClient notificationClient;
    PostRepository postRepository;

    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#commentId"),
            @CacheEvict(value = "nestedReplies", key = "#parentReplyId", condition = "#parentReplyId != null")
    })
    public CommentResponse createCommentReply(String commentId, String parentReplyId, CreateCommentRequest commentRequest) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        var profile = profileClient.getProfile(auth.getName());
        if (parentReplyId != null) {
            commentReplyRepository.findById(parentReplyId)
                    .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        }

        CommentReply commentReply = CommentReply.builder()
                .userId(auth.getName())
                .userName(profile.getResult().getFirstName())
                .updatedAt(Instant.now())
                .createdAt(Instant.now())
                .content(commentRequest.getContent())
                .commentId(comment.getId())
                .parentReplyId(parentReplyId) // <-- thêm dòng này
                .build();
        var post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_FOUND));
        var user = identityClient.getUser(post.getUserId());
        Event event = Event.builder()
                .postId(post.getId())
                .senderId(commentReply.getId())
                .senderName(commentReply.getUserName())
                .receiverId(user.getResult().getId())
                .receiverName(user.getResult().getUsername())
                .receiverEmail(user.getResult().getEmail())
                .timestamp(LocalDateTime.now())
                .build();
        notificationClient.sendReplyCommentNotification(event);
        return commentMapper.toCommentResponse(commentReplyRepository.save(commentReply));
    }


    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#root.target.getCommentIdByReplyId(#commentReplyId)"),
            @CacheEvict(value = "nestedReplies", key = "#root.target.getParentReplyId(#commentReplyId)"),
            @CacheEvict(value = "commentReplyById", key = "#commentReplyId")
    })
    public CommentResponse updateCommentReply(String commentReplyId, CreateCommentRequest commentReply) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentReplyRepository.findById(commentReplyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        comment.setUpdatedAt(Instant.now());
        comment.setContent(commentReply.getContent());
        return commentMapper.toCommentResponse(commentReplyRepository.save(comment));
    }


    @Caching(evict = {
            @CacheEvict(value = "commentReplies", key = "#root.target.getCommentIdByReplyId(#commentId)"),
            @CacheEvict(value = "nestedReplies", key = "#root.target.getParentReplyId(#commentId)"),
            @CacheEvict(value = "commentReplyById", key = "#commentId")
    })
    public String deleteCommentReply(String commentId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentReplyRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        commentReplyRepository.deleteById(comment.getId());
        return "Comment deleted";
    }

    @Cacheable(
            value = "commentReplies",
            key = "#commentId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CommentResponse> getAllCommentReplyByCommentId(String commentId) {
        var commentResponses = commentReplyRepository.findAllByCommentId(commentId);
        return commentResponses.stream().map(commentMapper::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Cacheable(
            value = "commentReplyById",
            key = "#commentReplyId",
            unless = "#result == null"
    )
    public CommentResponse getCommentReplyByCommentReplyId(String commentReplyId) {
        var commentReply = commentReplyRepository.findById(commentReplyId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        return commentMapper.toCommentResponse(commentReply);
    }

    @Cacheable(
            value = "nestedReplies",
            key = "#parentReplyId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<CommentResponse> getRepliesByParentReplyId(String parentReplyId) {
        return commentReplyRepository.findAllByParentReplyId(parentReplyId)
                .stream()
                .map(commentMapper::toCommentResponse)
                .collect(Collectors.toList());
    }


    public String getCommentIdByReplyId(String replyId) {
        return commentReplyRepository.findById(replyId)
                .map(CommentReply::getCommentId)
                .orElse(null);
    }

    public String getParentReplyId(String replyId) {
        return commentReplyRepository.findById(replyId)
                .map(CommentReply::getParentReplyId)
                .orElse(null);
    }
}
