package com.example.storyservice.controller;

import com.example.storyservice.dto.request.CreateStoryRequest;
import com.example.storyservice.dto.response.ApiResponse;
import com.example.storyservice.entity.Story;
import com.example.storyservice.service.StoryService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StoryController {
    StoryService storyService;
    @PostMapping("/create")
    public ApiResponse<Story> createStory(@RequestBody CreateStoryRequest createStoryRequest) {
        return ApiResponse.<Story>builder()
                .result(storyService.createStory(createStoryRequest))
                .build();
    }
}
