package com.postservice.repository;

import com.postservice.dto.response.CommentResponse;
import com.postservice.entity.Comment;
import com.postservice.entity.CommentReply;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface CommentReplyRepository extends MongoRepository<CommentReply, String> {
    List<CommentReply> findAllByCommentId(String commentId);

    List<CommentReply> findAllByParentReplyId(String parentReplyId);

}
