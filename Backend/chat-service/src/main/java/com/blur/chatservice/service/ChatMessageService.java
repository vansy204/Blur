package com.blur.chatservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.entity.MediaAttachment;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.enums.MessageType;
import com.blur.chatservice.exception.AppException;
import com.blur.chatservice.exception.ErrorCode;
import com.blur.chatservice.mapper.ChatMessageMapper;
import com.blur.chatservice.repository.ChatMessageRepository;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;

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

    public ChatMessageResponse create(ChatMessageRequest request, String userId) {

        if (request.getConversationId() == null || request.getConversationId().isEmpty()) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        // Validate message or attachments exists
        boolean hasMessage = request.getMessage() != null && !request.getMessage().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();

        if (!hasMessage && !hasAttachments) {
            throw new AppException(ErrorCode.INVALID_FILE);
        }

        // Validate attachments if present
        if (request.getAttachments() != null) {
            for (int i = 0; i < request.getAttachments().size(); i++) {
                MediaAttachment att = request.getAttachments().get(i);

                if (att.getUrl() == null || att.getUrl().isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_FILE);
                }

                if (att.getFileSize() != null && att.getFileSize() > 10485760) { // 10MB
                    throw new AppException(ErrorCode.FILE_TOO_LARGE);
                }
            }
        }

        // Validate user
        var userResponse = profileClient.getProfile(userId);
        if (userResponse == null || userResponse.getResult() == null) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }

        var conversation = conversationRepository
                .findById(request.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> userResponse.getResult().getUserId().equals(p.getUserId()));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var userInfo = userResponse.getResult();

        ChatMessage chatMessage = ChatMessage.builder()
                .conversationId(request.getConversationId())
                .message(request.getMessage())
                .attachments(request.getAttachments())
                .messageType(determineMessageType(request))
                .sender(ParticipantInfo.builder()
                        .userId(userInfo.getUserId())
                        .username(userInfo.getUsername())
                        .firstName(userInfo.getFirstName())
                        .lastName(userInfo.getLastName())
                        .avatar(userInfo.getImageUrl())
                        .build())
                .createdDate(Instant.now())
                .build();


        if (chatMessage.getAttachments() != null) {
            for (int i = 0; i < chatMessage.getAttachments().size(); i++) {
                MediaAttachment att = chatMessage.getAttachments().get(i);
                if (att.getUrl() == null || att.getUrl().isEmpty()) {
                    throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
                }
            }
        }

        // Save to database
        try {
            chatMessage = chatMessageRepository.save(chatMessage);
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Verify saved attachments
        if (chatMessage.getAttachments() != null) {
            for (int i = 0; i < chatMessage.getAttachments().size(); i++) {
                MediaAttachment att = chatMessage.getAttachments().get(i);

                if (att.getUrl() == null || att.getUrl().isEmpty()) {
                } else {
                }
            }
        } else {
        }

        // Build response manually
        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(chatMessage.getId())
                .conversationId(chatMessage.getConversationId())
                .message(chatMessage.getMessage())
                .messageType(chatMessage.getMessageType())
                .attachments(chatMessage.getAttachments())
                .sender(chatMessage.getSender())
                .createdDate(chatMessage.getCreatedDate())
                .me(userId.equals(chatMessage.getSender().getUserId()))
                .build();
        return response;
    }

    private MessageType determineMessageType(ChatMessageRequest request) {
        boolean hasMessage = request.getMessage() != null && !request.getMessage().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();

        if (!hasAttachments) {
            return MessageType.TEXT;
        }
        if (hasMessage) {
            return MessageType.MIXED;
        }
        // Xác định type từ attachment đầu tiên
        String fileType = request.getAttachments().get(0).getFileType();
        if (fileType == null) return MessageType.FILE;
        if (fileType.startsWith("image/")) return MessageType.IMAGE;
        if (fileType.startsWith("video/")) return MessageType.VIDEO;

        return MessageType.FILE;
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage msg, String currentUserId) {
        ChatMessageResponse response = ChatMessageResponse.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .message(msg.getMessage())
                .messageType(msg.getMessageType())
                .attachments(msg.getAttachments())
                .sender(msg.getSender())
                .createdDate(msg.getCreatedDate())
                .build();

        if (currentUserId != null && msg.getSender() != null) {
            response.setMe(currentUserId.equals(msg.getSender().getUserId()));
        }

        return response;
    }

    public List<ChatMessageResponse> getMessages(String conversationId) {
        String userId = null;
        try {
            userId = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
        }

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        var userResponse = profileClient.getProfile(userId);
        if (userResponse == null || userResponse.getResult() == null) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }

        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> userResponse.getResult().getUserId().equals(p.getUserId()));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        var messages = chatMessageRepository
                .findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        final String finalUserId = userId;

        return messages.stream()
                .map(msg -> {
                    return toChatMessageResponse(msg, finalUserId);
                })
                .toList();
    }
}