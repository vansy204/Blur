package com.postservice.mapper;

import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.Comment;

import com.postservice.entity.CommentReply;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CommentMapper {
    CommentResponse toCommentResponse(Comment comment);
    CommentResponse toCommentResponse (CommentReply commentReply);
}
