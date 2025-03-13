package com.postservice.repository;

import com.postservice.entity.CommentLike;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CommentLikeRepository extends MongoRepository<CommentLike, String> {
    List<CommentLike> findAllByCommentId(String commentId);
}
