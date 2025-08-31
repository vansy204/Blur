package com.blur.chatservice.service;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.entity.WebsocketSession;
import com.blur.chatservice.exception.AppException;
import com.blur.chatservice.exception.ErrorCode;
import com.blur.chatservice.mapper.ChatMessageMapper;
import com.blur.chatservice.repository.ChatMessageRepository;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.WebsocketSessionRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class  ChatMessageService {
    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatMessageMapper chatMessageMapper;
    ChatMessageRepository chatMessageRepository;
    SocketIOServer socketIOServer;
    WebsocketSessionRepository websocketSessionRepository;
    ObjectMapper objectMapper;

    public ChatMessageResponse create(ChatMessageRequest chatMessageRequest) throws JsonProcessingException {
        // validated conversationId
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userResponse = profileClient.getProfile(userId);
        var conversation = conversationRepository.findById(chatMessageRequest.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        conversation.getParticipants()
                .stream()
                .filter(participantInfo -> userResponse.getResult().getId().equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));


        // buid chatmessage info
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
        // create chat message
        chatMessage = chatMessageRepository.save(chatMessage);
        //publish socket event to client
        // get participants Ids
        List<String> userIds = conversation.getParticipants()
                .stream()
                .map(ParticipantInfo::getUserId)
                .toList();
        Map<String, WebsocketSession > websocketSessions =
                websocketSessionRepository.findALlByUserIdIn(userIds)
                        .stream()
                        .collect(Collectors.toMap(
                                WebsocketSession::getSocketSessionId, Function.identity()
                        ));
        ChatMessageResponse chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        socketIOServer.getAllClients().forEach(client -> {
            var websocketSession = websocketSessions.get(client.getSessionId().toString());
            if(Objects.nonNull(websocketSession)){
                String message = null;
                try {
                    chatMessageResponse.setMe( websocketSession.getUserId().equals(userId));
                    message = objectMapper.writeValueAsString(chatMessageResponse );
                    client.sendEvent("message", message);
                } catch (JsonProcessingException e) {
                    throw new RuntimeException(e);
                }
            }
        });
        return toChatMessageResponse(chatMessage);
    }
    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);
        chatMessageResponse.setMe(userId.equals(chatMessage.getSender().getUserId()));
        return chatMessageResponse;
    }
    public List<ChatMessageResponse> getMessages(String conversationId){
        // validate conversation
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userResponse = profileClient.getProfile(userId);
        var conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        conversation.getParticipants()
                .stream()
                .filter(participantInfo -> userResponse.getResult().getId().equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        return messages.stream().map(this::toChatMessageResponse).toList();

    }
}
