package com.blur.chatservice.controller;

import com.blur.chatservice.entity.Message;
import com.blur.chatservice.repository.MessageRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;

import static java.lang.System.*;

@Controller
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ChatController {
    SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send") // client sẽ gửi vào /app/chat/send
    public void sendMessage(Message message, Principal principal) {
        message.setSenderId(principal.getName());
        message.setTimestamp(Instant.now());
        // Gửi đến user nhận thông qua /user/{receiver}/queue/messages
        messagingTemplate.convertAndSendToUser(
                message.getReceiverId(),
                "/queue/messages",
                message
        );

    }
}