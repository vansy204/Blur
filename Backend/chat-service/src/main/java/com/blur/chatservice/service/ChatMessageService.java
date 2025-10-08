package com.blur.chatservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.exception.AppException;
import com.blur.chatservice.exception.ErrorCode;
import com.blur.chatservice.mapper.ChatMessageMapper;
import com.blur.chatservice.repository.ChatMessageRepository;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ChatMessageService {
    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatMessageMapper chatMessageMapper;
    ChatMessageRepository chatMessageRepository;
    SocketIOServer socketIOServer;
    WebsocketSessionRepository websocketSessionRepository;
    ObjectMapper objectMapper;

    public ChatMessageResponse create(ChatMessageRequest chatMessageRequest, String userId)
            throws JsonProcessingException {
        // Validate user profile
        var userResponse = profileClient.getProfile(userId);

        // Validate conversation
        var conversation = conversationRepository
                .findById(chatMessageRequest.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        conversation.getParticipants().stream()
                .filter(participantInfo -> userResponse.getResult().getUserId().equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Build chat message
        var userInfo = userResponse.getResult();
        ChatMessage chatMessage = chatMessageMapper.toChatMessage(chatMessageRequest);
        chatMessage.setSender(ParticipantInfo.builder()
                .userId(userInfo.getUserId())
                .username(userInfo.getUsername())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatar(userInfo.getImageUrl())
                .build());
        chatMessage.setCreatedDate(Instant.now());

        // Save to database
        chatMessage = chatMessageRepository.save(chatMessage);



        return toChatMessageResponse(chatMessage, null);
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String currentUserId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);

        // Chỉ set 'me' flag nếu currentUserId được cung cấp
        if (currentUserId != null) {
            chatMessageResponse.setMe(
                    currentUserId.equals(chatMessage.getSender().getUserId()));
        }

        return chatMessageResponse;
    }

    public List<ChatMessageResponse> getMessages(String conversationId) {
        String userId = null;
        try {
            userId = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
        }

        var userResponse = profileClient.getProfile(userId);

        // Validate conversation
        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        conversation.getParticipants().stream()
                .filter(participantInfo -> userResponse.getResult().getUserId().equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        final String finalUserId = userId;
        return messages.stream()
                .map(msg -> toChatMessageResponse(msg, finalUserId))
                .toList();
    }
}
