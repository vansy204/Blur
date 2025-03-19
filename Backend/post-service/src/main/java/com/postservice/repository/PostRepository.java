package com.postservice.repository;


import com.postservice.entity.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
     List<Post> findAllByUserIdOrderByCreatedAtDesc(String userId);

     Post findByUserId(String userId);

    List<Post> findAllByOrderByCreatedAtDesc();
}
