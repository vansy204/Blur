package com.blur.chatservice.controller;

import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import com.blur.chatservice.service.ChatMessageService;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.blur.chatservice.dto.request.IntrospectRequest;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.entity.WebsocketSession;

import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SocketHandler {
    SocketIOServer socketIOServer;
    IdentityService identityService;
    WebsocketSessionService websocketSessionService;
    WebsocketSessionRepository websocketSessionRepository;
    ChatMessageService chatMessageService;
    ConversationRepository conversationRepository;

    // Cache để tracking messages đã gửi (tránh duplicate)
    private final ConcurrentHashMap<String, Long> sentMessages = new ConcurrentHashMap<>();
    private static final long MESSAGE_CACHE_TTL = 5000; // 5 seconds

    // Remove annotation, use manual registration
    public void clientConnected(SocketIOClient client) {
        log.info("Client connecting: {}", client.getSessionId());

        String token = client.getHandshakeData().getSingleUrlParam("token");

        if (token == null || token.isEmpty()) {
            log.error("❌ No token provided");
            client.sendEvent("auth_error", Map.of("message", "Token required"));
            client.disconnect();
            return;
        }

        try {
            var introspectRes = identityService.introspect(
                    IntrospectRequest.builder().token(token).build());

            if (!introspectRes.isValid()) {
                log.error("❌ Invalid token");
                client.sendEvent("auth_error", Map.of("message", "Invalid token"));
                client.disconnect();
                return;
            }

            // Store user info in client session
            String userId = introspectRes.getUserId();
            client.set("userId", userId);
            client.set("token", token);

            // Persist websocket session
            WebsocketSession websocketSession = WebsocketSession.builder()
                    .socketSessionId(client.getSessionId().toString())
                    .userId(userId)
                    .createdAt(Instant.now())
                    .build();

            websocketSessionService.createWebsocketSession(websocketSession);

            log.info("✅ User {} connected successfully with session {}", userId, client.getSessionId());

            // Send connection confirmation
            client.sendEvent("connected", Map.of(
                    "userId", userId,
                    "sessionId", client.getSessionId().toString(),
                    "timestamp", Instant.now().toString()
            ));

        } catch (Exception e) {
            log.error("❌ Authentication failed: ", e);
            client.sendEvent("auth_error", Map.of("message", "Authentication failed"));
            client.disconnect();
        }
    }

    // Remove annotation, use manual registration
    public void clientDisconnected(SocketIOClient client) {
        String userId = client.get("userId");
        log.info("Client disconnected: {} (User: {})", client.getSessionId(), userId);

        try {
            websocketSessionService.deleteSession(client.getSessionId().toString());
            log.info("✅ Session cleaned up for: {}", client.getSessionId());
        } catch (Exception e) {
            log.error("❌ Error during disconnection cleanup: ", e);
        }
    }

    @OnEvent("send_message")
    public void onSendMessage(SocketIOClient senderClient, Map<String, Object> data) {
        long startTime = System.currentTimeMillis();
        log.info("📨 === Processing message ===");

        try {
            // Validate client session
            String senderId = senderClient.get("userId");
            if (senderId == null) {
                log.error("❌ No user session found");
                senderClient.sendEvent("message_error", Map.of(
                        "message", "Session expired",
                        "code", "SESSION_EXPIRED"
                ));
                return;
            }

            // Extract and validate message data
            String conversationId = (String) data.get("conversationId");
            String message = (String) data.get("message");
            String messageId = (String) data.get("messageId");
            String clientId = (String) data.get("clientId");

            if (conversationId == null || message == null || message.trim().isEmpty()) {
                senderClient.sendEvent("message_error", Map.of(
                        "message", "Invalid message data",
                        "code", "INVALID_DATA"
                ));
                return;
            }

            // Check duplicate message trong cache
            String cacheKey = conversationId + ":" + messageId;
            Long lastSent = sentMessages.get(cacheKey);
            if (lastSent != null && (System.currentTimeMillis() - lastSent) < MESSAGE_CACHE_TTL) {
                log.warn("⚠️ Duplicate message detected, ignoring: {}", messageId);
                return;
            }

            log.info("📝 Message details:");
            log.info("   ConversationId: {}", conversationId);
            log.info("   MessageId: {}", messageId);
            log.info("   SenderId: {}", senderId);
            log.info("   ClientId: {}", clientId);

            // Get conversation participants
            var conversation = conversationRepository.findById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            List<ParticipantInfo> participants = conversation.getParticipants();

            if (participants.size() != 2) {
                log.error("❌ Invalid conversation - participants: {}", participants.size());
                senderClient.sendEvent("message_error", Map.of(
                        "message", "Invalid conversation",
                        "code", "INVALID_CONVERSATION"
                ));
                return;
            }

            // Find receiver
            String receiverId = participants.stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElse(null);

            if (receiverId == null) {
                log.error("❌ Receiver not found");
                senderClient.sendEvent("message_error", Map.of(
                        "message", "Receiver not found",
                        "code", "RECEIVER_NOT_FOUND"
                ));
                return;
            }

            log.info("👤 Sender: {} → Receiver: {}", senderId, receiverId);

            // Get sender info for display
            ParticipantInfo senderInfo = participants.stream()
                    .filter(p -> p.getUserId().equals(senderId))
                    .findFirst()
                    .orElse(null);

            // Get all active sessions for BOTH users
            List<WebsocketSession> activeSessions = websocketSessionRepository
                    .findALlByUserIdIn(List.of(senderId, receiverId));

            log.info("🔍 Found {} active sessions", activeSessions.size());

            // Build message response
            Map<String, Object> messageResponse = new HashMap<>();
            messageResponse.put("id", messageId);
            messageResponse.put("messageId", messageId);
            messageResponse.put("conversationId", conversationId);
            messageResponse.put("message", message);
            messageResponse.put("senderId", senderId);
            messageResponse.put("clientId", clientId);
            messageResponse.put("createdDate", Instant.now().toString());

            // Add sender info
            if (senderInfo != null) {
                Map<String, Object> sender = new HashMap<>();
                sender.put("userId", senderInfo.getUserId());
                sender.put("username", senderInfo.getUsername());
                sender.put("firstName", senderInfo.getFirstName());
                sender.put("lastName", senderInfo.getLastName());
                sender.put("avatar", senderInfo.getAvatar());
                messageResponse.put("sender", sender);
            }

            // Broadcast to ALL active sessions of BOTH users
            int successCount = 0;
            int failCount = 0;

            for (WebsocketSession session : activeSessions) {
                try {
                    UUID sessionUUID = UUID.fromString(session.getSocketSessionId());
                    SocketIOClient targetClient = socketIOServer.getClient(sessionUUID);

                    if (targetClient != null && targetClient.isChannelOpen()) {
                        // Clone message và set flag 'me' dựa trên userId
                        Map<String, Object> msgToSend = new HashMap<>(messageResponse);
                        boolean isMe = session.getUserId().equals(senderId);
                        msgToSend.put("me", isMe);

                        // Send to client
                        targetClient.sendEvent("message_received", msgToSend);
                        successCount++;

                        log.info("✅ Sent to user {} (session: {}, me: {})",
                                session.getUserId(),
                                session.getSocketSessionId().substring(0, 8) + "...",
                                isMe);
                    } else {
                        log.warn("⚠️ Client not connected or channel closed: {}",
                                session.getSocketSessionId());
                        failCount++;
                    }
                } catch (IllegalArgumentException e) {
                    log.error("❌ Invalid session UUID: {}", session.getSocketSessionId());
                    failCount++;
                } catch (Exception e) {
                    log.error("❌ Failed to send to session {}: {}",
                            session.getSocketSessionId(), e.getMessage());
                    failCount++;
                }
            }

            // Cache message để tránh duplicate
            sentMessages.put(cacheKey, System.currentTimeMillis());

            // Cleanup old cache entries
            cleanupMessageCache();

            long duration = System.currentTimeMillis() - startTime;
            log.info("🎉 Message broadcast complete:");
            log.info("   ✅ Success: {} clients", successCount);
            log.info("   ❌ Failed: {} clients", failCount);
            log.info("   ⏱️  Duration: {}ms", duration);

            // Optional: Send delivery confirmation to sender
            senderClient.sendEvent("message_sent", Map.of(
                    "messageId", messageId,
                    "conversationId", conversationId,
                    "timestamp", Instant.now().toString(),
                    "delivered", successCount > 0
            ));

        } catch (Exception e) {
            log.error("❌ Fatal error processing message: ", e);
            senderClient.sendEvent("message_error", Map.of(
                    "message", "Failed to send message",
                    "error", e.getMessage(),
                    "code", "INTERNAL_ERROR"
            ));
        }
    }

    /**
     * Cleanup old message cache entries to prevent memory leak
     */
    private void cleanupMessageCache() {
        long now = System.currentTimeMillis();
        sentMessages.entrySet().removeIf(entry ->
                (now - entry.getValue()) > MESSAGE_CACHE_TTL
        );
    }

    // Remove annotation, use manual registration
    public void onTyping(SocketIOClient client, Map<String, Object> data) {
        try {
            String senderId = client.get("userId");
            String conversationId = (String) data.get("conversationId");
            Boolean isTyping = (Boolean) data.getOrDefault("isTyping", false);

            if (senderId == null || conversationId == null) return;

            // Get conversation participants
            var conversation = conversationRepository.findById(conversationId)
                    .orElse(null);

            if (conversation == null) return;

            // Find receiver
            String receiverId = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElse(null);

            if (receiverId == null) return;

            // Get receiver's sessions
            List<WebsocketSession> receiverSessions = websocketSessionRepository
                    .findByUserId(receiverId);

            // Broadcast typing status to receiver
            Map<String, Object> typingData = Map.of(
                    "conversationId", conversationId,
                    "userId", senderId,
                    "isTyping", isTyping
            );

            for (WebsocketSession session : receiverSessions) {
                try {
                    SocketIOClient targetClient = socketIOServer.getClient(
                            UUID.fromString(session.getSocketSessionId())
                    );
                    if (targetClient != null && targetClient.isChannelOpen()) {
                        targetClient.sendEvent("user_typing", typingData);
                    }
                } catch (Exception e) {
                    log.debug("Failed to send typing status: {}", e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Error handling typing event: ", e);
        }
    }

    @PostConstruct
    public void startServer() {
        log.info("Starting SocketIO Server...");

        socketIOServer.start();

        // Đăng ký event listeners
        socketIOServer.addConnectListener(client -> {
            log.info("Connect event triggered for: {}", client.getSessionId());
            clientConnected(client);
        });

        socketIOServer.addDisconnectListener(client -> {
            log.info("Disconnect event triggered for: {}", client.getSessionId());
            clientDisconnected(client);
        });

        // ⚠️ CRITICAL: Đăng ký send_message event
        socketIOServer.addEventListener("send_message", Map.class, (client, data, ackRequest) -> {
            log.info("send_message event triggered!");
            log.info("   Client: {}", client.getSessionId());
            log.info("   Data: {}", data);
            onSendMessage(client, data);
        });

        socketIOServer.addEventListener("typing", Map.class, (client, data, ackRequest) -> {
            log.info("typing event triggered");
            onTyping(client, data);
        });

        log.info("SocketIO Server started successfully");
        log.info("   Port: 8099");
        log.info("   Registered events: connect, disconnect, send_message, typing");
    }

    @PreDestroy
    public void stopServer() {
        log.info("Stopping SocketIO Server...");
        sentMessages.clear();
        socketIOServer.stop();
        log.info("SocketIO Server stopped");
    }
}