package com.blur.chatservice.controller;


import com.blur.chatservice.dto.request.MessageRequest;
import com.blur.chatservice.dto.response.ApiResponse;
import com.blur.chatservice.dto.response.MessageResponse;
import com.blur.chatservice.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ChatController {
    ChatService chatService;

    @PostMapping("/send")
    public ApiResponse<MessageResponse> sendMessage(@RequestBody MessageRequest messageRequest) {
        MessageResponse messageResponse = chatService.sendMessage(messageRequest);
        return ApiResponse.<MessageResponse>builder()
                .result(messageResponse)
                .build();
    }
    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<MessageResponse>> getMessages(@PathVariable String conversationId) {
        List<MessageResponse> messages = chatService.getConversationMessages(conversationId);
        return ApiResponse.<List<MessageResponse>>builder()
                .result(messages)
                .build();
    }
    @PutMapping("/conversations/{conversationId}/read")
    public ApiResponse<Void> markMessagesAsRead(@PathVariable String conversationId) {
        chatService.markConversationAsRead(conversationId);
        return ApiResponse.<Void>builder()
                .build();
    }
    @MessageMapping("/chat")
    public void processMessage(@Payload MessageRequest messageRequest,
                               SimpMessageHeaderAccessor headerAccessor) {
        chatService.processMessage(messageRequest);
    }
}