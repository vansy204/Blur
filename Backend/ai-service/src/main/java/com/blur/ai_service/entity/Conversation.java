package com.blur.ai_service.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@Document(collection = "conversations")
public class Conversation {

    @Id
    private String id;
    private String userId;
    private Instant createdAt;
    private Instant updatedAt;
    private List<ChatMessage> messages;
}
