package com.blur.ai_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {
    private String conversationId; // null nếu là cuộc chat mới
    private String userId;         // id user trong hệ thống của bạn
    private String message;
}