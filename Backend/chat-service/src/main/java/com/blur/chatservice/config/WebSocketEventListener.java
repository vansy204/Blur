package com.blur.chatservice.config;


import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.enums.MessageType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;

import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {
    private final SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handlerWebSocketDisconnected(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String userName =(String) headerAccessor.getSessionAttributes().get("username");
        if(userName != null) {
            log.info("Username disconnected:{} ", userName);
            var chatMessage = ChatMessage.builder()
                    .type(MessageType.LEAVE)
                    .sender(userName)
                    .build();
            messagingTemplate.convertAndSend("/topic/public", chatMessage);
        }
    }
}
