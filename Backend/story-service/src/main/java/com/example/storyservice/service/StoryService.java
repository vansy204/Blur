package com.example.storyservice.service;

import com.example.storyservice.dto.request.CreateStoryRequest;
import com.example.storyservice.entity.Story;
import com.example.storyservice.mapper.StoryMapper;
import com.example.storyservice.repository.StoryRepository;
import com.example.storyservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;

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
}
