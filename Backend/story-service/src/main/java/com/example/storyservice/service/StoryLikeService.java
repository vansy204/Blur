package com.example.storyservice.service;

import com.example.storyservice.entity.StoryLike;
import com.example.storyservice.exception.AppException;
import com.example.storyservice.exception.ErrorCode;
import com.example.storyservice.repository.StoryLikeRepository;
import com.example.storyservice.repository.StoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoryLikeService {
    StoryLikeRepository storyLikeRepository;
    StoryRepository storyRepository;

    public String likeStory(String storyId){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var story = storyRepository.findById(storyId)
                .orElseThrow(() -> new AppException(ErrorCode.STORY_NOT_FOUND));
        StoryLike storyLike = StoryLike.builder()
                .storyId(storyId)
                .userId(userId)
                .createdAt(story.getCreatedAt())
                .updatedAt(story.getUpdatedAt())
                .build();
        storyLikeRepository.save(storyLike);
        return "Like story successfully";
    }
    public String unlikeStory(String storyId){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        storyLikeRepository.deleteByStoryIdAndUserId(storyId, userId);
        return "Unlike story successfully";
    }
}
