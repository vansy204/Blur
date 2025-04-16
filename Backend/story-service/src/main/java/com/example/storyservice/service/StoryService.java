package com.example.storyservice.service;

import com.example.storyservice.dto.request.CreateStoryRequest;
import com.example.storyservice.entity.Story;
import com.example.storyservice.exception.AppException;
import com.example.storyservice.exception.ErrorCode;
import com.example.storyservice.mapper.StoryMapper;
import com.example.storyservice.repository.StoryRepository;
import com.example.storyservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PostAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StoryService {
    StoryRepository storyRepository;
    ProfileClient profileClient;
    StoryMapper storyMapper;
    public Story createStory(CreateStoryRequest createStoryRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var profile = profileClient.getProfile(userId);
        Story story = Story.builder()
                .content(createStoryRequest.getContent())
                .mediaUrl(createStoryRequest.getMediaUrl())
                .timestamp(createStoryRequest.getTimestamp())
                .authorId(userId)
                .firstName(profile.getResult().getFirstName())
                .lastName(profile.getResult().getLastName())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        storyRepository.save(story);
        return story;
    }
    public Story getStoryById(String id){
        return storyRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.STORY_NOT_FOUND));
    }
    @PostAuthorize("returnObject.get(0).authorId == authentication.name")
    public List<Story> getAllMyStories() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        return storyRepository.findAllByAuthorId(userId);
    }
    public List<Story> getAllStories() {
        return storyRepository.findAll();
    }
    public List<Story> getAllStoriesByUserId(String userId) {
        return storyRepository.findAllByAuthorId(userId);
    }
    public String deleteStoryById(String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var story = storyRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.STORY_NOT_FOUND));
        if(!userId.equals(story.getAuthorId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        storyRepository.deleteById(id);
        return "Delete story successfully";
    }
    public Story updateStory(String id, CreateStoryRequest createStoryRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        var userId = authentication.getName();
        var story = storyRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.STORY_NOT_FOUND));
        if(!userId.equals(story.getAuthorId())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        story.setContent(createStoryRequest.getContent());
        story.setMediaUrl(createStoryRequest.getMediaUrl());
        story.setTimestamp(createStoryRequest.getTimestamp());
        story.setUpdatedAt(Instant.now());
        return storyRepository.save(story);
    }

}
