package com.example.storyservice.repository;

import com.example.storyservice.entity.Story;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoryRepository extends MongoRepository<Story,String> {
}
