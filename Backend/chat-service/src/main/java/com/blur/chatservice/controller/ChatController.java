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

import static java.lang.System.*;

@Controller
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ChatController {

    SimpMessagingTemplate simpMessagingTemplate;
    MessageRepository messageRepository;

    @MessageMapping("/private")
    public void sendPrivateMessage(
            @Payload String message,
            @Header("username") String recipientUsername) {
        out.println("Sending message to " + recipientUsername + ": " + message);

        simpMessagingTemplate.convertAndSendToUser(
                recipientUsername,
                "/queue/private",
                "From sender: " + message);
        messageRepository.save(Message.builder()
                .content(message)
                .receiverId(recipientUsername)
                .build());

    }
}