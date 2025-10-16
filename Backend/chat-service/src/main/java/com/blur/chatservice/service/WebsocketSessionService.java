package com.blur.chatservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.repository.WebsocketSessionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebsocketSessionService {
    WebsocketSessionRepository websocketSessionRepository;

    @Transactional
    public WebsocketSession createSession(String sessionId, String userId) {
        WebsocketSession session = WebsocketSession.builder()
                .socketSessionId(sessionId)
                .userId(userId)
                .createdAt(Instant.now())
                .build();

        return websocketSessionRepository.save(session);
    }

    @Transactional
    public void deleteSession(String sessionId) {
        websocketSessionRepository.deleteBySocketSessionId(sessionId);
    }

    public boolean isUserOnline(String userId) {
        return !websocketSessionRepository.findByUserId(userId).isEmpty();
    }

    public List<WebsocketSession> getUserSessions(String userId) {
        return websocketSessionRepository.findByUserId(userId);
    }

    public int getActiveSessionCount(String userId) {
        return websocketSessionRepository.findByUserId(userId).size();
    }
}
