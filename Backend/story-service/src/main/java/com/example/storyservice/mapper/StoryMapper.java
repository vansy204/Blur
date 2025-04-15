package com.example.storyservice.mapper;

import com.example.storyservice.dto.request.CreateStoryRequest;
import com.example.storyservice.entity.Story;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")

public interface StoryMapper {
    Story toEntity(CreateStoryRequest createStoryRequest);
}
