package com.blur.chatservice.service;

import java.time.Instant;
import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.Authentication;
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
import com.blur.chatservice.repository.ChatMessageRepository;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageService {

    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatMessageRepository chatMessageRepository;
    RedisCacheService redisCacheService;

    /**
     * Create new message
     * Evict: conversationMessages, unreadCount, lastMessage, userConversations
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "conversationMessages", key = "#request.conversationId"),
            @CacheEvict(value = "unreadCount", key = "#request.conversationId + ':' + #userId"),
            @CacheEvict(value = "lastMessage", key = "#request.conversationId"),
            @CacheEvict(value = "userConversations", allEntries = true) // Evict to refresh conversation list
    })
    public ChatMessageResponse create(ChatMessageRequest request, String userId) {
        if (request.getConversationId() == null || request.getConversationId().isEmpty()) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        boolean hasMessage = request.getMessage() != null && !request.getMessage().trim().isEmpty();
        boolean hasAttachments = request.getAttachments() != null && !request.getAttachments().isEmpty();

        if (!hasMessage && !hasAttachments) {
            throw new AppException(ErrorCode.EMPTY_MESSAGE);
        }

        if (request.getAttachments() != null) {
            for (MediaAttachment att : request.getAttachments()) {
                if (att.getUrl() == null || att.getUrl().isEmpty()) {
                    throw new AppException(ErrorCode.INVALID_FILE);
                }

                if (att.getFileSize() != null && att.getFileSize() > 10485760) {
                    throw new AppException(ErrorCode.FILE_TOO_LARGE);
                }
            }
        }

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
                .readBy(List.of(userInfo.getUserId()))
                .build();

        chatMessage = chatMessageRepository.save(chatMessage);

        // Cache operations
        redisCacheService.cacheMessage(chatMessage.getId(), chatMessage, 30);
        redisCacheService.invalidateConversationMessages(request.getConversationId());
        redisCacheService.evictLastMessage(request.getConversationId());

        return toChatMessageResponse(chatMessage, userId);
    }

    @Cacheable(
            value = "conversationMessages",
            key = "#conversationId",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ChatMessageResponse> getMessages(String conversationId) {
        String userId = null;
        try {
            userId = SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
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

        var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        final String finalUserId = userId;
        return messages.stream()
                .map(msg -> toChatMessageResponse(msg, finalUserId))
                .toList();
    }

    @Cacheable(
            value = "unreadCount",
            key = "#conversationId + ':' + #root.target.getCurrentUserId()",
            unless = "#result == null"
    )
    public Integer unreadCount(String conversationId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth != null ? auth.getName() : null;

        if (userId == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        Integer cachedCount = redisCacheService.getUnreadCount(conversationId, userId);
        if (cachedCount != null) {
            return cachedCount;
        }

        var userResponse = profileClient.getProfile(userId);
        if (userResponse == null || userResponse.getResult() == null) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }

        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(p -> p.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        long count = chatMessageRepository.countByConversationIdAndReadByNotContains(conversationId, userId);
        int intCount = (int) count;

        redisCacheService.cacheUnreadCount(conversationId, userId, intCount);

        return intCount;
    }

    @Transactional
    @CacheEvict(value = "unreadCount", key = "#conversationId + ':' + #userId")
    public String markAsRead(String conversationId, String userId) {
        List<ChatMessage> messages =
                chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        for (ChatMessage msg : messages) {
            if (!msg.getReadBy().contains(userId)) {
                msg.getReadBy().add(userId);
                msg.setIsRead(true);
            }
        }

        chatMessageRepository.saveAll(messages);
        redisCacheService.evictUnreadCount(conversationId, userId);

        return "mark as read";
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
                .readBy(msg.getReadBy())
                .build();

        if (currentUserId != null && msg.getSender() != null) {
            response.setMe(currentUserId.equals(msg.getSender().getUserId()));
        }

        return response;
    }

    public String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}