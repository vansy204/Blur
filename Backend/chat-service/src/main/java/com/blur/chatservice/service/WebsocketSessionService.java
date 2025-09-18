package com.blur.chatservice.service;

import org.springframework.stereotype.Service;

import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.repository.WebsocketSessionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class WebsocketSessionService {
    WebsocketSessionRepository websocketSessionRepository;

    public WebsocketSession createWebsocketSession(WebsocketSession websocketSession) {
        return websocketSessionRepository.save(websocketSession);
    }

    public void deleteSession(String sessionId) {
        websocketSessionRepository.deleteBySocketSessionId(sessionId);
    }
}
