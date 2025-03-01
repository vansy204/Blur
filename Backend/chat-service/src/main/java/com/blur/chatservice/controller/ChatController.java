package com.blur.chatservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    public ChatController(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @MessageMapping("/private")
    public void sendPrivateMessage(
            @Payload String message,
            @Header("username") String recipientUsername) {
        System.out.println("Sending message to " + recipientUsername + ": " + message);
        simpMessagingTemplate.convertAndSendToUser(
                recipientUsername,
                "/queue/private",
                "From sender: " + message);
    }
}