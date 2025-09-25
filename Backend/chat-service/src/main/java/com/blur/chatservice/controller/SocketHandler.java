package com.blur.chatservice.controller;

import java.time.Instant;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.request.IntrospectRequest;
import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.service.ChatMessageService;
import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.fasterxml.jackson.core.JsonProcessingException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SocketHandler {
    SocketIOServer socketIOServer;
    IdentityService identityService;
    WebsocketSessionService websocketSessionService;
    ChatMessageService chatMessageService;

    @OnConnect
    public void clientConnected(SocketIOClient client) {
        // get token from request params
        String token = client.getHandshakeData().getSingleUrlParam("token");

        // verify
        var introspectRes = identityService.introspect(
                IntrospectRequest.builder().token(token).build());
        // if token is invalid => disconnect
        if (introspectRes.isValid()) {
            log.info("client connected");
            // persist websocket session
            WebsocketSession websocketSession = WebsocketSession.builder()
                    .socketSessionId(client.getSessionId().toString())
                    .userId(introspectRes.getUserId())
                    .createdAt(Instant.now())
                    .build();
            websocketSessionService.createWebsocketSession(websocketSession);
            log.info("websocket session created: {}", websocketSession.getSocketSessionId());
        } else {
            log.error("authentication failed");
            client.disconnect();
        }
    }

    @OnEvent("send_message")
    public void onSendMessage(SocketIOClient client, ChatMessageRequest request) {
        try {
            log.info("Received send_message from client {}: {}", client.getSessionId(), request);
            // Tạo tin nhắn và tự động publish cho những người tham gia
            chatMessageService.create(request);
            // Không cần tự sendEvent ở đây vì create() đã publish
        } catch (JsonProcessingException e) {
            log.error("Error while sending message: {}", e.getMessage(), e);
            client.sendEvent("error", "Cannot send message");
        }
    }

    @OnDisconnect
    public void clientDisconnected(SocketIOClient client) {
        log.info("client disconnected: {}", client.getSessionId());
        websocketSessionService.deleteSession(client.getSessionId().toString());
    }

    @PostConstruct
    public void startServer() {
        socketIOServer.start();
        socketIOServer.addListeners(this);

        log.info("SocketIOServer started");
    }

    @PreDestroy
    public void stopServer() {
        socketIOServer.stop();
        log.info("SocketIOServer stopped");
    }
}
