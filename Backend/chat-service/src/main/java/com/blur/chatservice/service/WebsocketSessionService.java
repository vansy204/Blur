package com.blur.chatservice.service;

import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class WebsocketSessionService {
    WebsocketSessionRepository websocketSessionRepository;

    public WebsocketSession createWebsocketSession(WebsocketSession websocketSession){
        return websocketSessionRepository.save(websocketSession);
    }
    public void deleteSession(String sessionId){
        websocketSessionRepository.deleteBySocketSessionId(sessionId);
    }

}
