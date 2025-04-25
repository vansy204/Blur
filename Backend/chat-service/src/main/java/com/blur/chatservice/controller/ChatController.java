package com.blur.chatservice.controller;

import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.service.ChatService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ChatController {

    ChatService chatService;
    SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        // luu tin nhan
        chatMessage = chatService.saveMessage(
                chatMessage.getSenderId(),
                chatMessage.getReceiverId(),
                chatMessage.getContent());

        // gui tin nhan den nguoi nhan
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverId(),
                "/queue/messages",
                chatMessage
        );
    }

}
