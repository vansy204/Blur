package com.blur.chatservice.controller;

import com.blur.chatservice.dto.ApiResponse;
import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.repository.ChatMessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/messages")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ChatRestController {
    ChatMessageRepository chatMessageRepository;
    @GetMapping("/{userId}")
    public ApiResponse<ChatMessage> getChatMessage(@PathVariable String userId, Principal principal) {
        return chatMessageRepository.findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(principal.getName(),userId,userId,principal.getName())
                .stream()
                .findFirst()
                .map(chatMessage -> ApiResponse.<ChatMessage>builder()
                        .code(200)
                        .message("Success")
                        .result(chatMessage)
                        .build())
                .orElse(ApiResponse.<ChatMessage>builder()
                        .code(404)
                        .message("No messages found")
                        .build());
    }
}
