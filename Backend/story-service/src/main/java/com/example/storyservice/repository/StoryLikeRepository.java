package com.example.storyservice.repository;

import com.example.storyservice.entity.StoryLike;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryLikeRepository extends MongoRepository<StoryLike, String> {
    StoryLike findByStoryId(String storyId);
    void deleteByStoryIdAndUserId(String storyId, String userId);
}
