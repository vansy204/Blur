package com.blur.chatservice.controller;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.MediaAttachment;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.service.ChatMessageService;
import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;

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
    ConversationRepository conversationRepository;

    ConcurrentHashMap<String, Long> processedMessages = new ConcurrentHashMap<>();
    ConcurrentHashMap<String, Set<UUID>> userSessions = new ConcurrentHashMap<>();

    static final long DUPLICATE_THRESHOLD = 3000;
    static final long CLEANUP_INTERVAL = 300000; // 5 phút

    @PostConstruct
    public void startServer() {
        socketIOServer.addConnectListener(this::handleConnect);
        socketIOServer.addDisconnectListener(this::handleDisconnect);
        socketIOServer.addEventListener("send_message", Map.class, this::handleSendMessage);
        socketIOServer.addEventListener("typing", Map.class, this::handleTyping);
        socketIOServer.start();
        log.info("✅ SocketIO Server started successfully");
    }

    @PreDestroy
    public void stopServer() {
        processedMessages.clear();
        userSessions.clear();
        socketIOServer.stop();
        log.info("🔴 SocketIO Server stopped");
    }

    private void handleConnect(SocketIOClient client) {
        String token = extractToken(client);

        if (token == null || token.isEmpty()) {
            sendError(client, "auth_error", "TOKEN_REQUIRED", "Token required");
            client.disconnect();
            return;
        }

        try {
            var introspectRes = identityService.introspect(com.blur.chatservice.dto.request.IntrospectRequest.builder()
                    .token(token)
                    .build());

            if (!introspectRes.isValid()) {
                sendError(client, "auth_error", "INVALID_TOKEN", "Invalid token");
                client.disconnect();
                return;
            }

            String userId = introspectRes.getUserId();
            client.set("userId", userId);

            userSessions
                    .computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet())
                    .add(client.getSessionId());

            websocketSessionService.createSession(client.getSessionId().toString(), userId);

            Map<String, Object> connectedData = Map.of(
                    "userId", userId,
                    "sessionId", client.getSessionId().toString(),
                    "timestamp", Instant.now().toString());

            client.sendEvent("connected", connectedData);
            log.info("✅ User connected: {} (session: {})", userId, client.getSessionId());

        } catch (Exception e) {
            log.error("❌ Auth failed for client {}: {}", client.getSessionId(), e.getMessage());
            sendError(client, "auth_error", "AUTH_FAILED", "Authentication failed");
            client.disconnect();
        }
    }

    private void handleDisconnect(SocketIOClient client) {
        String userId = client.get("userId");
        try {
            if (userId != null) {
                Set<UUID> sessions = userSessions.get(userId);
                if (sessions != null) {
                    sessions.remove(client.getSessionId());
                    if (sessions.isEmpty()) {
                        userSessions.remove(userId);
                    }
                }
            }
            websocketSessionService.deleteSession(client.getSessionId().toString());
            log.info("🔌 User disconnected: {} (session: {})", userId, client.getSessionId());
        } catch (Exception e) {
            log.error("❌ Error handling disconnect: {}", e.getMessage());
        }
    }

    private void handleSendMessage(SocketIOClient client, Map<String, Object> data, Object ack) {
        try {
            String senderId = client.get("userId");
            if (senderId == null) {
                sendError(client, "message_error", "SESSION_EXPIRED", "Session expired");
                return;
            }

            String conversationId = (String) data.get("conversationId");
            String message = (String) data.get("message");
            String tempMessageId = (String) data.get("messageId");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> attachmentsData = (List<Map<String, Object>>) data.get("attachments");

            if (conversationId == null) {
                sendError(client, "message_error", "INVALID_DATA", "Conversation ID required");
                return;
            }

            boolean hasMessage = message != null && !message.trim().isEmpty();
            boolean hasAttachments = attachmentsData != null && !attachmentsData.isEmpty();

            if (!hasMessage && !hasAttachments) {
                sendError(client, "message_error", "EMPTY_MESSAGE", "Message or attachments required");
                return;
            }

            // === CHECK DUPLICATE ===
            String messageKey = conversationId + ":" + tempMessageId;
            if (isDuplicate(messageKey)) {
                log.warn("⚠️ Duplicate message ignored: {}", messageKey);
                return;
            }

            // === BUILD REQUEST ===
            ChatMessageRequest.ChatMessageRequestBuilder builder =
                    ChatMessageRequest.builder().conversationId(conversationId).message(message);

            if (hasAttachments) {
                List<MediaAttachment> attachments =
                        attachmentsData.stream().map(this::mapToAttachment).collect(Collectors.toList());
                builder.attachments(attachments);
            }

            ChatMessageRequest request = builder.build();

            // === LƯU MESSAGE VÀO DATABASE ===
            ChatMessageResponse savedMessage = chatMessageService.create(request, senderId);
            log.info("💾 Message saved: {} in conversation {}", savedMessage.getId(), conversationId);

            // === TÌM RECEIVER ===
            var conversation = conversationRepository
                    .findById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            if (conversation.getParticipants().size() != 2) {
                sendError(client, "message_error", "INVALID_CONVERSATION", "Invalid conversation");
                return;
            }

            String receiverId = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            // === BUILD PAYLOAD ===
            Map<String, Object> payload = buildMessagePayload(savedMessage, tempMessageId);

            // === SỰ KIỆN 1: GỬI "message_sent" CHO NGƯỜI GỬI ===
            int senderCount = sendToUser(senderId, "message_sent", payload);
            log.info("✅ Sent 'message_sent' to sender {} ({} sessions)", senderId, senderCount);

            int receiverCount = sendToUser(receiverId, "message_received", payload);
            log.info("📨 Sent 'message_received' to receiver {} ({} sessions)", receiverId, receiverCount);

            // === MARK AS PROCESSED ===
            markAsProcessed(messageKey);

        } catch (Exception e) {
            log.error("❌ Error handling send_message: {}", e.getMessage(), e);
            sendError(client, "message_error", "INTERNAL_ERROR", "Failed to send message");
        }
    }

    /**
     * XỬ LÝ TYPING INDICATOR
     */
    private void handleTyping(SocketIOClient client, Map<String, Object> data, Object ack) {
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

            Map<String, Object> typingData = Map.of(
                    "conversationId", conversationId,
                    "userId", senderId,
                    "isTyping", isTyping);

            sendToUser(receiverId, "user_typing", typingData);
            log.debug("⌨️ Typing indicator sent: {} -> {}", senderId, receiverId);

        } catch (Exception e) {
            log.error("❌ Error handling typing: {}", e.getMessage());
        }
    }

    /**
     * MAP ATTACHMENT DATA
     */
    private MediaAttachment mapToAttachment(Map<String, Object> data) {
        if (data == null) return null;

        return MediaAttachment.builder()
                .id((String) data.get("id"))
                .url((String) data.get("url"))
                .fileName((String) data.get("fileName"))
                .fileType((String) data.get("fileType"))
                .fileSize(getNumber(data, "fileSize", Long.class))
                .width(getNumber(data, "width", Integer.class))
                .height(getNumber(data, "height", Integer.class))
                .duration(getNumber(data, "duration", Integer.class))
                .thumbnailUrl((String) data.get("thumbnailUrl"))
                .build();
    }

    @SuppressWarnings("unchecked")
    private <T extends Number> T getNumber(Map<String, Object> data, String key, Class<T> type) {
        Object value = data.get(key);
        if (value == null) return null;

        if (type == Long.class) {
            return (T) Long.valueOf(((Number) value).longValue());
        } else if (type == Integer.class) {
            return (T) Integer.valueOf(((Number) value).intValue());
        }
        return null;
    }

    /**
     * BUILD MESSAGE PAYLOAD
     */
    private Map<String, Object> buildMessagePayload(ChatMessageResponse msg, String tempId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", msg.getId());
        payload.put("messageId", msg.getId());
        payload.put("tempMessageId", tempId);
        payload.put("conversationId", msg.getConversationId());
        payload.put("message", msg.getMessage());
        payload.put(
                "messageType",
                msg.getMessageType() != null ? msg.getMessageType().toString() : "TEXT");
        payload.put("createdDate", msg.getCreatedDate().toString());

        if (msg.getSender() != null) {
            ParticipantInfo sender = msg.getSender();
            payload.put("senderId", sender.getUserId());

            Map<String, Object> senderMap = Map.of(
                    "userId", orEmpty(sender.getUserId()),
                    "username", orEmpty(sender.getUsername()),
                    "firstName", orEmpty(sender.getFirstName()),
                    "lastName", orEmpty(sender.getLastName()),
                    "avatar", orEmpty(sender.getAvatar()));
            payload.put("sender", senderMap);
        }

        if (msg.getAttachments() != null && !msg.getAttachments().isEmpty()) {
            payload.put("attachments", msg.getAttachments());
        }

        return payload;
    }

    /**
     * GỬI EVENT ĐÉN TẤT CẢ SESSIONS CỦA 1 USER
     * @return Số lượng sessions đã gửi thành công
     */
    private int sendToUser(String userId, String event, Object data) {
        Set<UUID> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
            log.warn("⚠️ No active sessions for user: {}", userId);
            return 0;
        }

        int count = 0;
        for (UUID sessionId : sessions) {
            try {
                SocketIOClient client = socketIOServer.getClient(sessionId);
                if (client != null && client.isChannelOpen()) {
                    client.sendEvent(event, data);
                    count++;
                }
            } catch (Exception e) {
                log.error("❌ Error sending to session {}: {}", sessionId, e.getMessage());
            }
        }
        return count;
    }

    /**
     * EXTRACT TOKEN TỪ HANDSHAKE
     */
    private String extractToken(SocketIOClient client) {
        String token = client.getHandshakeData().getSingleUrlParam("token");

        if (token == null || token.isEmpty()) {
            Object authObj = client.getHandshakeData().getAuthToken();
            if (authObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> authMap = (Map<String, Object>) authObj;
                token = (String) authMap.get("token");
            }
        }

        return token;
    }

    /**
     * KIỂM TRA DUPLICATE MESSAGE
     */
    private boolean isDuplicate(String key) {
        Long lastTime = processedMessages.get(key);
        return lastTime != null && (System.currentTimeMillis() - lastTime) < DUPLICATE_THRESHOLD;
    }

    /**
     * ĐÁNH DẤU MESSAGE ĐÃ XỬ LÝ
     */
    private void markAsProcessed(String key) {
        processedMessages.put(key, System.currentTimeMillis());

        // Cleanup old entries (giữ ConcurrentHashMap nhỏ gọn)
        long now = System.currentTimeMillis();
        processedMessages.entrySet().removeIf(e -> (now - e.getValue()) > CLEANUP_INTERVAL);
    }

    /**
     * GỬI ERROR ĐÉN CLIENT
     */
    private void sendError(SocketIOClient client, String event, String code, String message) {
        Map<String, Object> error = Map.of(
                "code", code,
                "message", message,
                "timestamp", Instant.now().toString());
        client.sendEvent(event, error);
    }

    /**
     * HELPER: RETURN EMPTY STRING IF NULL
     */
    private String orEmpty(String value) {
        return value != null ? value : "";
    }
}
