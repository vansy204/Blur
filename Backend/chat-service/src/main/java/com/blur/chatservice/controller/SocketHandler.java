package com.blur.chatservice.controller;


import com.blur.chatservice.dto.request.ChatMessageRequest;

import java.time.Instant;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.blur.chatservice.dto.request.IntrospectRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;
import com.blur.chatservice.service.ChatMessageService;
import com.blur.chatservice.service.IdentityService;
import com.blur.chatservice.service.WebsocketSessionService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SocketHandler {
    SocketIOServer socketIOServer;
    IdentityService identityService;
    WebsocketSessionService websocketSessionService;

    ProfileClient profileClient;
    ChatMessageService chatMessageService;
    ConversationRepository conversationRepository;
    WebsocketSessionRepository websocketSessionRepository;

 

    @OnConnect
    public void clientConnected(SocketIOClient client) {
        // get token from request params
        String token = client.getHandshakeData().getSingleUrlParam("token");

        // verify
        var introspectRes = identityService.introspect(
                IntrospectRequest.builder().token(token).build());
        // if token is invalid => disconnect
        if (introspectRes.isValid()) {
            log.info("client connected");
            // persist websocket session
            WebsocketSession websocketSession = WebsocketSession.builder()
                    .socketSessionId(client.getSessionId().toString())
                    .userId(introspectRes.getUserId())
                    .createdAt(Instant.now())
                    .build();
            websocketSessionService.createWebsocketSession(websocketSession);
            log.info("websocket session created: {}", websocketSession.getSocketSessionId());
        } else {
            log.error("authentication failed");
            client.disconnect();
        }
    }

    @OnDisconnect
    public void clientDisconnected(SocketIOClient client) {

        log.info("Client disconnected: {}", client.getSessionId());
        try {
            websocketSessionService.deleteSession(client.getSessionId().toString());
        } catch (Exception e) {
            log.error("Error during client disconnection cleanup: ", e);
        }
    }

        log.info("client disconnected: {}", client.getSessionId());
        websocketSessionService.deleteSession(client.getSessionId().toString());
    }

    @PostConstruct
    public void startServer() {
        socketIOServer.start();
        socketIOServer.addListeners(this);

    @OnEvent("send_message")
    public void onSendMessage(SocketIOClient client, ChatMessageRequest data) {
        log.info("=== Processing send_message event ===");

        try {
            String token = client.getHandshakeData().getSingleUrlParam("token");
            log.info("Token exists: {}", token != null && !token.isEmpty());
            log.info("Conversation ID: {}", data.getConversationId());
            log.info("Message content length: {}", data.getMessage() != null ? data.getMessage().length() : 0);

            // Validate input data
            if (data.getConversationId() == null || data.getMessage() == null || data.getMessage().trim().isEmpty()) {
                log.error("Invalid message data - missing conversationId or message content");
                client.sendEvent("message_error", Map.of(
                        "message", "Invalid message data"
                ));
                return;
            }

            if (token == null || token.isEmpty()) {
                log.error("No token provided in send_message event");
                client.sendEvent("auth_error", Map.of("message", "No authentication token"));
                return;
            }

            // Verify token again for security
            var introspectRes = identityService.introspect(IntrospectRequest.builder().token(token).build());
            log.info("Token validation result: valid={}, userId={}",
                    introspectRes.isValid(),
                    introspectRes.isValid() ? introspectRes.getUserId() : "N/A");

            if (!introspectRes.isValid()) {
                log.error("AUTHENTICATION FAILED - Token invalid or expired");
                client.sendEvent("auth_error", Map.of(
                        "message", "Authentication failed - token invalid or expired"

                ));
                return;
            }

            String userId = introspectRes.getUserId();
            log.info("Processing message from authenticated user: {}", userId);

            // FIXED: Set up Security Context manually for Socket operations
            // This ensures authentication.getName() won't be null in ChatMessageService
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Create message with explicit userId parameter
            ChatMessageResponse chatMessageResponse = chatMessageService.create(data, userId);
            log.info("Message created successfully with ID: {}", chatMessageResponse.getId());

            // Set the 'me' flag based on current user
            chatMessageResponse.setMe(userId.equals(chatMessageResponse.getSender().getUserId()));

            // Get all participants in the conversation
            List<String> participantUserIds = conversationRepository.findById(data.getConversationId())
                    .map(conversation -> conversation.getParticipants().stream()
                            .map(ParticipantInfo::getUserId)
                            .collect(Collectors.toList()))
                    .orElse(List.of());

            log.info("Found {} participants in conversation {}", participantUserIds.size(), data.getConversationId());

            if (participantUserIds.isEmpty()) {
                log.warn("No participants found for conversation: {}", data.getConversationId());
                client.sendEvent("message_error", Map.of(
                        "message", "Conversation not found or no participants"

                ));
                return;
            }

            // Get active WebSocket sessions for participants
            Map<String, WebsocketSession> sessionsBySocketId = websocketSessionRepository.findALlByUserIdIn(participantUserIds)
                    .stream()
                    .collect(Collectors.toMap(WebsocketSession::getSocketSessionId, ws -> ws));

            log.info("Found {} active socket sessions for participants", sessionsBySocketId.size());

            // Send "message_received" event to all participants
            int messagesSent = 0;
            int totalClients = socketIOServer.getAllClients().size();
            log.info("Checking {} total connected clients", totalClients);

            for (SocketIOClient sioClient : socketIOServer.getAllClients()) {
                WebsocketSession wsSession = sessionsBySocketId.get(sioClient.getSessionId().toString());
                if (wsSession != null) {
                    try {
                        // Create a copy of the message for each recipient with correct 'me' flag
                        ChatMessageResponse messageForRecipient = ChatMessageResponse.builder()
                                .id(chatMessageResponse.getId())
                                .conversationId(chatMessageResponse.getConversationId())
                                .message(chatMessageResponse.getMessage())
                                .createdDate(chatMessageResponse.getCreatedDate())
                                .sender(chatMessageResponse.getSender())
                                .me(wsSession.getUserId().equals(userId)) // Set 'me' flag based on recipient
                                .build();
                        sioClient.sendEvent("message_received", messageForRecipient);
                        messagesSent++;
                        log.info("Message sent to client: {} (user: {}) ",
                                sioClient.getSessionId(), wsSession.getUserId());
                    } catch (Exception e) {
                        log.error("Error sending message to client {}: {}",
                                sioClient.getSessionId(), e.getMessage());
                    }
                }
            }

            log.info("Successfully sent message to {} out of {} participants", messagesSent, participantUserIds.size());

            // Send success confirmation to sender if no messages were sent
            if (messagesSent == 0) {
                log.warn("No active sessions found for participants - sending confirmation to sender only");
                client.sendEvent("message_sent", Map.of(
                        "message", "Message saved but no active recipients",
                        "messageId", chatMessageResponse.getId()
                ));
            } else {
                // Send confirmation to sender
                client.sendEvent("message_sent", Map.of(
                        "message", "Message sent successfully",
                        "messageId", chatMessageResponse.getId(),
                        "recipientCount", messagesSent
                ));
            }

        } catch (Exception e) {
            log.error("Failed to process send_message event: ", e);
            client.sendEvent("message_error", Map.of(
                    "message", "Failed to send message: " + e.getMessage(),
                    "error", e.getClass().getSimpleName()
            ));
        } finally {
            // IMPORTANT: Clear Security Context after processing
            SecurityContextHolder.clearContext();
        }
    }


    @PreDestroy
    public void stopServer() {
        socketIOServer.stop();
        log.info("SocketIOServer stopped");

    }
}