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

    @PostConstruct
    public void startServer() {
        socketIOServer.addConnectListener(this::handleConnect);
        socketIOServer.addDisconnectListener(this::handleDisconnect);
        socketIOServer.addEventListener("send_message", Map.class, this::handleSendMessage);
        socketIOServer.addEventListener("typing", Map.class, this::handleTyping);
        socketIOServer.start();
    }

    @PreDestroy
    public void stopServer() {
        processedMessages.clear();
        userSessions.clear();
        socketIOServer.stop();
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

        } catch (Exception e) {
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
        } catch (Exception e) {
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
            // Validation
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

            // Check duplicate
            String messageKey = conversationId + ":" + tempMessageId;
            if (isDuplicate(messageKey)) {
                return;
            }

            // Build request
            ChatMessageRequest.ChatMessageRequestBuilder builder =
                    ChatMessageRequest.builder().conversationId(conversationId).message(message);

            if (hasAttachments) {
                List<MediaAttachment> attachments = attachmentsData.stream()
                        .map(attData -> {
                            MediaAttachment att = mapToAttachment(attData);
                            return att;
                        })
                        .collect(Collectors.toList());

                builder.attachments(attachments);
            }

            ChatMessageRequest request = builder.build();

            ChatMessageResponse savedMessage = chatMessageService.create(request, senderId);

            // Get receiver
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

            // Broadcast
            Map<String, Object> payload = buildMessagePayload(savedMessage, tempMessageId);

            int senderCount = sendToUser(senderId, "message_received", payload);
            int receiverCount = sendToUser(receiverId, "message_received", payload);

            markAsProcessed(messageKey);

        } catch (Exception e) {

            sendError(client, "message_error", "INTERNAL_ERROR", "Failed to send message");
        }
    }

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

        } catch (Exception e) {

        }
    }

    private MediaAttachment mapToAttachment(Map<String, Object> data) {
        if (data == null) {
            return null;
        }

        MediaAttachment attachment = MediaAttachment.builder()
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
        return attachment;
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
        } else {
        }

        return payload;
    }

    private int sendToUser(String userId, String event, Object data) {
        Set<UUID> sessions = userSessions.get(userId);
        if (sessions == null || sessions.isEmpty()) {
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
            }
        }
        return count;
    }

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

    private boolean isDuplicate(String key) {
        Long lastTime = processedMessages.get(key);
        return lastTime != null && (System.currentTimeMillis() - lastTime) < DUPLICATE_THRESHOLD;
    }

    private void markAsProcessed(String key) {
        processedMessages.put(key, System.currentTimeMillis());

        // Cleanup old entries
        long now = System.currentTimeMillis();
        processedMessages.entrySet().removeIf(e -> (now - e.getValue()) > 300000);
    }

    private void sendError(SocketIOClient client, String event, String code, String message) {
        client.sendEvent(event, Map.of("code", code, "message", message));
    }

    private String orEmpty(String value) {
        return value != null ? value : "";
    }
}
