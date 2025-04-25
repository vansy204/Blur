package com.blur.chatservice.controller;

import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ChatRestController {
    ChatService chatService;
    @GetMapping("/history")
    public List<ChatMessage> getChatHistory(
            @RequestParam String senderId,
            @RequestParam String receiverId
    ) {
        return chatService.getChatHistory(senderId, receiverId);
    }
}
