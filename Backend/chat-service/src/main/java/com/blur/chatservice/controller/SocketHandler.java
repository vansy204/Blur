package com.blur.chatservice.controller;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.request.IntrospectRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import com.blur.chatservice.service.ChatMessageService;
import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnEvent;

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
    WebsocketSessionRepository websocketSessionRepository;
    ChatMessageService chatMessageService;
    ConversationRepository conversationRepository;

    private final ConcurrentHashMap<String, Long> processedMessages = new ConcurrentHashMap<>();
    private static final long CACHE_TTL = 10000;

    public void clientConnected(SocketIOClient client) {
        log.info("🔌 Client connecting: {}", client.getSessionId());

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

            String userId = introspectRes.getUserId();
            client.set("userId", userId);
            client.set("token", token);

            WebsocketSession websocketSession = WebsocketSession.builder()
                    .socketSessionId(client.getSessionId().toString())
                    .userId(userId)
                    .createdAt(Instant.now())
                    .build();

            websocketSessionService.createWebsocketSession(websocketSession);

            log.info("✅ User {} connected (session: {})", userId, client.getSessionId());

            client.sendEvent(
                    "connected",
                    Map.of(
                            "userId", userId,
                            "sessionId", client.getSessionId().toString(),
                            "timestamp", Instant.now().toString()));

        } catch (Exception e) {
            log.error("❌ Authentication failed: ", e);
            client.sendEvent("auth_error", Map.of("message", "Authentication failed"));
            client.disconnect();
        }
    }

    public void clientDisconnected(SocketIOClient client) {
        String userId = client.get("userId");
        log.info("🔌 Client disconnected: {} (User: {})", client.getSessionId(), userId);

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
        log.info("📨 ========== Processing Message ==========");

        try {
            String senderId = senderClient.get("userId");
            if (senderId == null) {
                log.error("❌ No user session");
                senderClient.sendEvent(
                        "message_error",
                        Map.of(
                                "message", "Session expired",
                                "code", "SESSION_EXPIRED"));
                return;
            }

            String conversationId = (String) data.get("conversationId");
            String message = (String) data.get("message");
            String tempMessageId = (String) data.get("messageId");

            if (conversationId == null || message == null || message.trim().isEmpty()) {
                senderClient.sendEvent(
                        "message_error",
                        Map.of(
                                "message", "Invalid message data",
                                "code", "INVALID_DATA"));
                return;
            }

            String cacheKey = conversationId + ":" + senderId + ":" + message.hashCode();
            Long lastProcessed = processedMessages.get(cacheKey);
            if (lastProcessed != null && (System.currentTimeMillis() - lastProcessed) < CACHE_TTL) {
                log.warn("⚠️ Duplicate message detected, skipping");
                return;
            }

            log.info("📝 Message Info:");
            log.info("   Conversation: {}", conversationId);
            log.info("   Sender: {}", senderId);
            log.info("   TempId: {}", tempMessageId);

            ChatMessageRequest chatMessageRequest = ChatMessageRequest.builder()
                    .conversationId(conversationId)
                    .message(message)
                    .build();

            ChatMessageResponse savedMessage;
            try {
                savedMessage = chatMessageService.create(chatMessageRequest, senderId);
            } catch (Exception e) {
                log.error("❌ Failed to save message: ", e);
                senderClient.sendEvent(
                        "message_error",
                        Map.of(
                                "message", "Failed to save message",
                                "error", e.getMessage(),
                                "code", "DB_ERROR"));
                return;
            }

            log.info("💾 Message saved to DB with ID: {}", savedMessage.getId());

            var conversation = conversationRepository
                    .findById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            List<ParticipantInfo> participants = conversation.getParticipants();

            if (participants.size() != 2) {
                log.error("❌ Invalid conversation - participants: {}", participants.size());
                senderClient.sendEvent(
                        "message_error",
                        Map.of(
                                "message", "Invalid conversation",
                                "code", "INVALID_CONVERSATION"));
                return;
            }

            String receiverId = participants.stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            log.info("👥 Sender: {} → Receiver: {}", senderId, receiverId);

            Map<String, Object> messageResponse = buildMessageResponse(savedMessage, tempMessageId);

            log.info("🔍 Looking for sessions of users: [{}, {}]", senderId, receiverId);
            List<WebsocketSession> allSessions =
                    websocketSessionRepository.findALlByUserIdIn(List.of(senderId, receiverId));

            log.info("🔍 Found {} active sessions:", allSessions.size());
            for (WebsocketSession session : allSessions) {
                log.info(
                        "   Session {} → UserId: {}",
                        session.getSocketSessionId().substring(0, 8) + "...",
                        session.getUserId());
            }

            int successCount = broadcastMessage(allSessions, messageResponse, senderId);

            processedMessages.put(cacheKey, System.currentTimeMillis());
            cleanupCache();

            long duration = System.currentTimeMillis() - startTime;
            log.info("✅ Message broadcast complete:");
            log.info("   Delivered: {} clients", successCount);
            log.info("   Duration: {}ms", duration);
            log.info("==========================================");

        } catch (Exception e) {
            log.error("❌ Fatal error: ", e);
            senderClient.sendEvent(
                    "message_error",
                    Map.of(
                            "message", "Failed to send message",
                            "error", e.getMessage(),
                            "code", "INTERNAL_ERROR"));
        }
    }

    private Map<String, Object> buildMessageResponse(ChatMessageResponse savedMessage, String tempMessageId) {

        Map<String, Object> response = new HashMap<>();
        response.put("id", savedMessage.getId());
        response.put("messageId", savedMessage.getId());
        response.put("tempMessageId", tempMessageId);
        response.put("conversationId", savedMessage.getConversationId());
        response.put("message", savedMessage.getMessage());
        response.put("createdDate", savedMessage.getCreatedDate().toString());

        if (savedMessage.getSender() != null) {
            ParticipantInfo sender = savedMessage.getSender();
            Map<String, Object> senderMap = new HashMap<>();
            senderMap.put("userId", sender.getUserId());
            senderMap.put("username", sender.getUsername());
            senderMap.put("firstName", sender.getFirstName());
            senderMap.put("lastName", sender.getLastName());
            senderMap.put("avatar", sender.getAvatar());
            response.put("sender", senderMap);
            response.put("senderId", sender.getUserId());
        }

        return response;
    }

    private int broadcastMessage(
            List<WebsocketSession> sessions, Map<String, Object> messageResponse, String senderId) {

        int successCount = 0;

        for (WebsocketSession session : sessions) {
            try {
                UUID sessionUUID = UUID.fromString(session.getSocketSessionId());
                SocketIOClient client = socketIOServer.getClient(sessionUUID);

                if (client != null && client.isChannelOpen()) {
                    Map<String, Object> msg = new HashMap<>(messageResponse);
                    msg.put("me", session.getUserId().equals(senderId));

                    client.sendEvent("message_received", msg);
                    successCount++;

                    log.info("   ✅ Sent to user {} (me: {})", session.getUserId(), msg.get("me"));
                } else {
                    log.warn("   ⚠️ Client not found or channel closed for session: {}", session.getSocketSessionId());
                }
            } catch (Exception e) {
                log.error("   ❌ Failed to send to session {}: {}", session.getSocketSessionId(), e.getMessage());
            }
        }

        return successCount;
    }

    @OnEvent("typing")
    public void onTyping(SocketIOClient client, Map<String, Object> data) {
        try {
            String senderId = client.get("userId");
            String conversationId = (String) data.get("conversationId");
            Boolean isTyping = (Boolean) data.getOrDefault("isTyping", false);

            if (senderId == null || conversationId == null) return;

            var conversation = conversationRepository.findById(conversationId).orElse(null);
            if (conversation == null) return;

            String receiverId = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElse(null);

            if (receiverId == null) return;

            List<WebsocketSession> receiverSessions = websocketSessionRepository.findByUserId(receiverId);

            Map<String, Object> typingData = Map.of(
                    "conversationId", conversationId,
                    "userId", senderId,
                    "isTyping", isTyping);

            for (WebsocketSession session : receiverSessions) {
                try {
                    SocketIOClient targetClient =
                            socketIOServer.getClient(UUID.fromString(session.getSocketSessionId()));
                    if (targetClient != null && targetClient.isChannelOpen()) {
                        targetClient.sendEvent("user_typing", typingData);
                    }
                } catch (Exception e) {
                    log.debug("Failed to send typing: {}", e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error handling typing: ", e);
        }
    }

    private void cleanupCache() {
        long now = System.currentTimeMillis();
        processedMessages.entrySet().removeIf(entry -> (now - entry.getValue()) > CACHE_TTL);
    }

    @PostConstruct
    public void startServer() {
        log.info("🚀 Starting SocketIO Server...");

        socketIOServer.start();

        socketIOServer.addConnectListener(this::clientConnected);
        socketIOServer.addDisconnectListener(this::clientDisconnected);

        socketIOServer.addEventListener("send_message", Map.class, (client, data, ack) -> onSendMessage(client, data));

        socketIOServer.addEventListener("typing", Map.class, (client, data, ack) -> onTyping(client, data));

        log.info("✅ SocketIO Server started on port 8099");
    }

    @PreDestroy
    public void stopServer() {
        log.info("🛑 Stopping SocketIO Server...");
        processedMessages.clear();
        socketIOServer.stop();
    }
}
