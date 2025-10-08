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

    private final ConcurrentHashMap<String, Long> processedMessages = new ConcurrentHashMap<>();
    private static final long DUPLICATE_THRESHOLD = 3000;

    private final ConcurrentHashMap<String, Set<UUID>> userSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void startServer() {
        socketIOServer.addConnectListener(this::handleConnect);
        socketIOServer.addDisconnectListener(this::handleDisconnect);
        socketIOServer.addEventListener("send_message", Map.class, (client, data, ack) -> handleSendMessage(client, data));
        socketIOServer.addEventListener("typing", Map.class, (client, data, ack) -> handleTyping(client, data));
        socketIOServer.start();
    }

    @PreDestroy
    public void stopServer() {
        processedMessages.clear();
        userSessions.clear();
        socketIOServer.stop();
    }

    private void handleConnect(SocketIOClient client) {
        String token = null;
        token = client.getHandshakeData().getSingleUrlParam("token");
        if (token == null || token.isEmpty()) {
            Object authObj = client.getHandshakeData().getAuthToken();
            if (authObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> authMap = (Map<String, Object>) authObj;
                token = (String) authMap.get("token");
            }
        }
        if (token == null || token.isEmpty()) {
            sendError(client, "auth_error", "TOKEN_REQUIRED", "Token required");
            client.disconnect();
            return;
        }

        try {
            var introspectRes = identityService.introspect(IntrospectRequest.builder().token(token).build());

            if (!introspectRes.isValid()) {
                sendError(client, "auth_error", "INVALID_TOKEN", "Invalid token");
                client.disconnect();
                return;
            }

            String userId = introspectRes.getUserId();
            client.set("userId", userId);

            userSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(client.getSessionId());
            websocketSessionService.createSession(client.getSessionId().toString(), userId);
            Map<String, Object> connectedData = new HashMap<>();
            connectedData.put("userId", userId);
            connectedData.put("sessionId", client.getSessionId().toString());
            connectedData.put("timestamp", Instant.now().toString());

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
            log.error("Error during disconnection cleanup", e);
        }
    }

    private void handleSendMessage(SocketIOClient senderClient, Map<String, Object> data) {
        try {
            String senderId = senderClient.get("userId");
            if (senderId == null) {
                sendError(senderClient, "message_error", "SESSION_EXPIRED", "Session expired");
                return;
            }

            String conversationId = (String) data.get("conversationId");
            String message = (String) data.get("message");
            String tempMessageId = (String) data.get("messageId");

            if (conversationId == null || message == null || message.trim().isEmpty()) {
                sendError(senderClient, "message_error", "INVALID_DATA", "Invalid message data");
                return;
            }

            String messageKey = conversationId + ":" + tempMessageId;
            if (isDuplicate(messageKey)) {
                return;
            }


            ChatMessageRequest request = ChatMessageRequest.builder()
                    .conversationId(conversationId)
                    .message(message)
                    .build();

            ChatMessageResponse savedMessage = chatMessageService.create(request, senderId);

            var conversation = conversationRepository
                    .findById(conversationId)
                    .orElseThrow(() -> new RuntimeException("Conversation not found"));

            if (conversation.getParticipants().size() != 2) {
                sendError(senderClient, "message_error", "INVALID_CONVERSATION", "Invalid conversation");
                return;
            }

            String receiverId = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .filter(id -> !id.equals(senderId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));


            Map<String, Object> payload = buildMessagePayload(savedMessage, tempMessageId);

            markAsProcessed(messageKey);

        } catch (Exception e) {
            sendError(senderClient, "message_error", "INTERNAL_ERROR", "Failed to send message");
        }
    }

    private void handleTyping(SocketIOClient client, Map<String, Object> data) {
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

            Map<String, Object> typingData = new HashMap<>();
            typingData.put("conversationId", conversationId);
            typingData.put("userId", senderId);
            typingData.put("isTyping", isTyping);

            sendToUser(receiverId, "user_typing", typingData);

        } catch (Exception e) {
        }
    }

    private int sendToUser(String userId, String event, Object data) {
        Set<UUID> sessions = userSessions.get(userId);


        if (sessions == null || sessions.isEmpty()) {
            return 0;
        }

        int successCount = 0;
        for (UUID sessionId : sessions) {
            try {
                SocketIOClient client = socketIOServer.getClient(sessionId);
                if (client != null && client.isChannelOpen()) {
                    client.sendEvent(event, data);
                    successCount++;
                } else {
                }
            } catch (Exception e) {
            }
        }

        return successCount;
    }

    private Map<String, Object> buildMessagePayload(ChatMessageResponse msg, String tempId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", msg.getId());
        payload.put("messageId", msg.getId());
        payload.put("tempMessageId", tempId);
        payload.put("conversationId", msg.getConversationId());
        payload.put("message", msg.getMessage());
        payload.put("createdDate", msg.getCreatedDate().toString());

        if (msg.getSender() != null) {
            ParticipantInfo sender = msg.getSender();
            payload.put("senderId", sender.getUserId());

            Map<String, Object> senderMap = new HashMap<>();
            senderMap.put("userId", sender.getUserId());
            senderMap.put("username", orEmpty(sender.getUsername()));
            senderMap.put("firstName", orEmpty(sender.getFirstName()));
            senderMap.put("lastName", orEmpty(sender.getLastName()));
            senderMap.put("avatar", orEmpty(sender.getAvatar()));

            payload.put("sender", senderMap);
        }

        return payload;
    }

    private String orEmpty(String value) {
        return value != null ? value : "";
    }

    private boolean isDuplicate(String key) {
        Long lastTime = processedMessages.get(key);
        return lastTime != null && (System.currentTimeMillis() - lastTime) < DUPLICATE_THRESHOLD;
    }

    private void markAsProcessed(String key) {
        processedMessages.put(key, System.currentTimeMillis());
        long now = System.currentTimeMillis();
        processedMessages.entrySet().removeIf(entry -> (now - entry.getValue()) > 300000);
    }

    private void sendError(SocketIOClient client, String event, String code, String message) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("code", code);
        errorData.put("message", message);
        client.sendEvent(event, errorData);
    }

    private void sendError(SocketIOClient client, String event, String message) {
        sendError(client, event, "ERROR", message);
    }
}