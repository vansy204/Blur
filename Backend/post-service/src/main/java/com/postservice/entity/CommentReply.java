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
@Document(value = "comment-reply")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentReply {
    @MongoId
    String id;
    String content;
    String userId;
    String commentId;
    Instant createdAt;
    Instant updatedAt;
}
