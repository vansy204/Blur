package com.postservice.repository;

import com.postservice.entity.CommentLike;
import org.springframework.data.mongodb.repository.MongoRepository;


public interface CommentLikeRepository extends MongoRepository<CommentLike, String> {
}
