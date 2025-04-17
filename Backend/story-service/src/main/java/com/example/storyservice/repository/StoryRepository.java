package com.example.storyservice.repository;

import com.example.storyservice.entity.Story;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface StoryRepository extends MongoRepository<Story,String> {
    public List<Story> findAllByAuthorId(String authorId);
    @Query("{'createdAt': {$lt: ?0}}")
    List<Story> findAllByCreatedAtBefore(Instant timestamp);

}
