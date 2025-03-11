package com.postservice.service;

import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.Comment;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentRepository;
import com.postservice.repository.PostRepository;
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


    public CommentResponse createComment(CreateCommentRequest request, String postId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var comment = Comment.builder()
                .content(request.getContent())
                .userId(userId)
                .likeCount(0)
                .disLikeCount(0)
                .replyCount(0)
                .postId(postId)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();
        comment = commentRepository.save(comment);
        return commentMapper.toCommentResponse(comment);
    }
    public List<CommentResponse> getAllCommentByPostId(String postId) {
        return commentRepository.findAllByPostId(postId).stream().map(commentMapper::toCommentResponse).collect(Collectors.toList());
    }
}
