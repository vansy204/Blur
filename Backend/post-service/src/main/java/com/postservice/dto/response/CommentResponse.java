package com.postservice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
@NoArgsConstructor
public class CommentResponse {
    String id;
    String content;
    String userId;
    String userName;
    String postId;
    String createdAt;
    String updatedAt;
}
