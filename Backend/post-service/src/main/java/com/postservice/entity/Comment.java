package com.postservice.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Document(value = "comment")
@Builder
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
@NoArgsConstructor
public class Comment {
    @MongoId
    String id;
    String postId;
    String userId;
    String firstName;
    String lastName;
    String content;
    Instant createdAt;
    Instant updatedAt;
}
