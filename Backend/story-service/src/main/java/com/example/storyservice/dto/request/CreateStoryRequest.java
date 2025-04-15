package com.example.storyservice.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE  )
public class CreateStoryRequest {
    String content;
    String mediaUrl;
    Instant timestamp;

}
