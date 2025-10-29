package com.postservice.repository;


import com.postservice.dto.response.PostResponse;
import com.postservice.dto.response.UserProfileResponse;
import com.postservice.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends MongoRepository<Post, String> {
     List<Post> findAllByUserIdOrderByCreatedAtDesc(String userId);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);


    List<Post> findAllByOrderByCreatedAtDesc();
}
