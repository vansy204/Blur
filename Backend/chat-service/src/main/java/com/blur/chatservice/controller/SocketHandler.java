package com.blur.chatservice.controller;

import com.blur.chatservice.dto.request.IntrospectRequest;
import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.websocket.OnClose;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class SocketHandler {
    SocketIOServer socketIOServer;
    IdentityService identityService;
    WebsocketSessionService  websocketSessionService;



    @OnConnect
    public void clientConnected(SocketIOClient client) {
        // get token from request params
        String token = client.getHandshakeData().getSingleUrlParam("token");

        //verify
        var introspectRes = identityService.introspect(IntrospectRequest.builder()
                        .token(token).build());
        //if token is invalid => disconnect
        if(introspectRes.isValid()) {
            log.info("client connected");
            // persist websocket session
            WebsocketSession websocketSession = WebsocketSession.builder()
                    .socketSessionId(client.getSessionId().toString())
                    .userId(introspectRes.getUserId())
                    .createdAt(Instant.now())
                    .build();
            websocketSessionService.createWebsocketSession(websocketSession);
            log.info("websocket session created: {}", websocketSession.getSocketSessionId());
        }else{
            log.error("authentication failed");
            client.disconnect();
        }

    }
    @OnDisconnect
    public void clientDisconnected(SocketIOClient client) {
        log.info("client disconnected: {}",client.getSessionId());
        websocketSessionService.deleteSession(client.getSessionId().toString());
    }
    @PostConstruct
    public void startServer(){
        socketIOServer.start();
        socketIOServer.addListeners(this);

        log.info("SocketIOServer started");
    }
    @PreDestroy
    public void stopServer(){
        socketIOServer.stop();
        log.info("SocketIOServer stopped");
    }
}
