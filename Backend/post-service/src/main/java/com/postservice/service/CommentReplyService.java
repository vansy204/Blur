package com.postservice.service;

import com.postservice.dto.request.CreateCommentRequest;
import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.CommentReply;
import com.postservice.exception.AppException;
import com.postservice.exception.ErrorCode;
import com.postservice.mapper.CommentMapper;
import com.postservice.repository.CommentReplyRepository;
import com.postservice.repository.CommentRepository;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Builder
@RequiredArgsConstructor
@Service
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CommentReplyService {
    CommentReplyRepository commentReplyRepository;
    CommentRepository commentRepository;
    CommentMapper commentMapper;
    public CommentResponse createCommentReply(String commentId,CreateCommentRequest commentRequest){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        CommentReply commentReply = CommentReply.builder()
                .userId(auth.getName())
                .updatedAt(Instant.now())
                .createdAt(Instant.now())
                .content(commentRequest.getContent())
                .commentId(comment.getId())
                .build();
        return commentMapper.toCommentResponse(commentReplyRepository.save(commentReply));
    }
    public CommentResponse updateCommentReply(String commentId,CommentReply commentReply){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if(!comment.getUserId().equals(userId)) {
           throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        comment.setUpdatedAt(Instant.now());
        comment.setContent(commentReply.getContent());
        return commentMapper.toCommentResponse(commentRepository.save(comment));
    }
    public String deleteCommentReply(String commentId){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        var userId = auth.getName();
        var comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_FOUND));
        if(!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        commentReplyRepository.deleteById(comment.getId());
        return "Comment deleted";
    }
    public List<CommentResponse> getAllCommentReplyByCommentId(String commentId){
        var commentResponses = commentReplyRepository.findAllByCommentId(commentId);
        return commentResponses.stream().map(commentMapper::toCommentResponse)
                .collect(Collectors.toList());
    }

}
