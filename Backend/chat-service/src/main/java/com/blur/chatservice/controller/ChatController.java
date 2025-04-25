package com.blur.chatservice.controller;

import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.repository.ChatMessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Date;

@Controller
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatController {
    SimpMessagingTemplate messagingTemplate;
    ChatMessageRepository chatMessageRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage chatMessage, Principal principal) {
        chatMessage.setSenderId(principal.getName());
        chatMessage.setTimestamp(new Date());
        chatMessageRepository.save(chatMessage);
        messagingTemplate.convertAndSendToUser(
                chatMessage.getReceiverId(),
                "/queue/messages",
                chatMessage
        );
    }

}
