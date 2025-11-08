package com.blur.notificationservice.configuration;

import com.blur.notificationservice.service.RedisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final RedisService redisService;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String userId = null;

        // Ưu tiên lấy từ session attributes
        if (accessor.getSessionAttributes() != null) {
            userId = (String) accessor.getSessionAttributes().get("userId");
        }

        // Nếu không có thì lấy từ header hoặc Principal (phòng trường hợp handshake chưa truyền attr)
        if (userId == null && accessor.getUser() != null) {
            userId = accessor.getUser().getName();
        }

        if (userId != null) {
            redisService.setUserOnline(userId);
            log.info("✅ WS CONNECT: user {} marked ONLINE in Redis", userId);
        } else {
            log.warn("⚠️ WS CONNECT: userId is null, cannot mark online");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());

        String userId = (String) accessor.getSessionAttributes().get("userId");
        if (userId == null && accessor.getUser() != null) {
            userId = accessor.getUser().getName();
        }

        if (userId != null) {
            redisService.setUserOffline(userId);
            log.info("🚪 WS DISCONNECT: user {} marked OFFLINE in Redis", userId);
        } else {
            log.warn("⚠️ WS DISCONNECT: userId is null (no Principal & no session attr)");
        }
    }
}
