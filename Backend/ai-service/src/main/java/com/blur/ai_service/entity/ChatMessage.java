package com.blur.ai_service.entity;

import lombok.Data;
import java.time.Instant;

@Data
public class ChatMessage {
    private String role;       // "user" hoặc "assistant"
    private String content;
    private Instant timestamp;
}
