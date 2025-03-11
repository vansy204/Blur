package com.postservice.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Data
@Builder
@Document(value = "post-like")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostLike {
    @MongoId
    String id;
    String postId;
    String userId;
    Instant createdAt;
}
