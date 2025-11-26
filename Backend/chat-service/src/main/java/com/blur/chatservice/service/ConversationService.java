package com.blur.chatservice.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.stream.Collectors;

import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.enums.MessageType;
import com.blur.chatservice.repository.ChatMessageRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.blur.chatservice.dto.request.ConversationRequest;
import com.blur.chatservice.dto.response.ConversationResponse;
import com.blur.chatservice.entity.Conversation;
import com.blur.chatservice.entity.ParticipantInfo;
import com.blur.chatservice.exception.AppException;
import com.blur.chatservice.exception.ErrorCode;
import com.blur.chatservice.mapper.ConversationMapper;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {

    ConversationMapper conversationMapper;
    ProfileClient profileClient;
    ConversationRepository conversationRepository;
    ChatMessageRepository chatMessageRepository;  // ✅ ADD THIS
    RedisCacheService redisCacheService;

    /**
     * Get user's conversations with last messages
     * ✅ FIX: Use toConversationResponseWithLastMessage
     */
    @Cacheable(
            value = "userConversations",
            key = "#root.target.getCurrentUserId()",
            unless = "#result == null || #result.isEmpty()"
    )
    public List<ConversationResponse> myConversations() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userResponse = profileClient.getProfile(userId);

        List<Conversation> conversations = conversationRepository
                .findAllByParticipantIdsContains(userResponse.getResult().getUserId());

        // ✅ FIX: Map with last message
        return conversations.stream()
                .map(this::toConversationResponseWithLastMessage)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "userConversations", allEntries = true)
    public ConversationResponse createConversation(ConversationRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userInfoResponse = profileClient.getProfile(userId);
        var participantInfoResponse = profileClient.getProfile(request.getParticipantIds().get(0));

        if (Objects.isNull(userInfoResponse) || Objects.isNull(participantInfoResponse)) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }

        var userInfo = userInfoResponse.getResult();
        var participantInfo = participantInfoResponse.getResult();

        List<String> userIds = new ArrayList<>();
        userIds.add(userId);
        userIds.add(participantInfo.getUserId());

        var sortedIds = userIds.stream().sorted().toList();
        String userIdHash = generateParticipantHash(sortedIds);

        var conversation = conversationRepository
                .findByParticipantsHash(userIdHash)
                .orElseGet(() -> {
                    List<ParticipantInfo> participantInfos = List.of(
                            ParticipantInfo.builder()
                                    .userId(userInfo.getUserId())
                                    .username(userInfo.getUsername())
                                    .firstName(userInfo.getFirstName())
                                    .lastName(userInfo.getLastName())
                                    .avatar(userInfo.getImageUrl())
                                    .build(),
                            ParticipantInfo.builder()
                                    .userId(participantInfo.getUserId())
                                    .username(participantInfo.getUsername())
                                    .firstName(participantInfo.getFirstName())
                                    .lastName(participantInfo.getLastName())
                                    .avatar(participantInfo.getImageUrl())
                                    .build());

                    Conversation newConversation = Conversation.builder()
                            .type(request.getType())
                            .participantsHash(userIdHash)
                            .createdDate(Instant.now())
                            .modifiedDate(Instant.now())
                            .participants(participantInfos)
                            .build();
                    return conversationRepository.save(newConversation);
                });

        redisCacheService.cacheConversation(conversation.getId(), conversation, 15);

        return toConversationResponse(conversation);
    }

    @Transactional
    @CacheEvict(value = "userConversations", allEntries = true)
    public String deleteConversation(String conversationId) {
        conversationRepository.deleteById(conversationId);
        redisCacheService.evictConversation(conversationId);
        redisCacheService.evictLastMessage(conversationId);

        return "Deleted conversation successfully";
    }

    // ==================== PRIVATE HELPER METHODS ====================

    /**
     * ✅ NEW METHOD: Convert conversation to response WITH last message
     */
    private ConversationResponse toConversationResponseWithLastMessage(Conversation conversation) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        var profileResponse = profileClient.getProfile(currentUserId);

        // Build base response using mapper
        ConversationResponse response = conversationMapper.toConversationResponse(conversation);

        // Set conversation name and avatar
        conversation.getParticipants().stream()
                .filter(participantInfo -> !participantInfo
                        .getUserId()
                        .equals(profileResponse.getResult().getUserId()))
                .findFirst()
                .ifPresent(participantInfo -> {
                    response.setConversationName(
                            participantInfo.getFirstName() + " " + participantInfo.getLastName());
                    response.setConversationAvatar(participantInfo.getAvatar());
                });

        // ✅ GET AND SET LAST MESSAGE
        ChatMessage lastMessage = getLastMessageCached(conversation.getId());

        if (lastMessage != null) {
            response.setLastMessage(formatLastMessage(lastMessage));
            response.setLastMessageTime(lastMessage.getCreatedDate());

            if (lastMessage.getSender() != null) {
                String senderName = lastMessage.getSender().getFirstName() + " " +
                        lastMessage.getSender().getLastName();
                response.setLastMessageSender(senderName.trim());
            }
        }

        return response;
    }

    /**
     * Standard conversation response (without last message)
     */
    private ConversationResponse toConversationResponse(Conversation conversation) {
        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        var profileResponse = profileClient.getProfile(currentUserId);

        ConversationResponse response = conversationMapper.toConversationResponse(conversation);

        conversation.getParticipants().stream()
                .filter(participantInfo -> !participantInfo
                        .getUserId()
                        .equals(profileResponse.getResult().getUserId()))
                .findFirst()
                .ifPresent(participantInfo -> {
                    response.setConversationName(
                            participantInfo.getFirstName() + " " + participantInfo.getLastName());
                    response.setConversationAvatar(participantInfo.getAvatar());
                });

        return response;
    }

    /**
     * Get last message with Redis cache
     */
    private ChatMessage getLastMessageCached(String conversationId) {
        try {
            // 1. Try Redis cache first
            ChatMessage cached = redisCacheService.getLastMessage(conversationId, ChatMessage.class);
            if (cached != null) {
                return cached;
            }

            // 2. Cache miss - query MongoDB
            ChatMessage lastMessage = chatMessageRepository
                    .findFirstByConversationIdOrderByCreatedDateDesc(conversationId);

            // 3. Cache for next time
            if (lastMessage != null) {
                redisCacheService.cacheLastMessage(conversationId, lastMessage, 10);
            }

            return lastMessage;
        } catch (Exception e) {
            // Fallback to DB query on error
            return chatMessageRepository
                    .findFirstByConversationIdOrderByCreatedDateDesc(conversationId);
        }
    }

    /**
     * Format last message for display
     */
    private String formatLastMessage(ChatMessage message) {
        if (message.getMessage() != null && !message.getMessage().isEmpty()) {
            String content = message.getMessage();
            return content.length() > 50 ? content.substring(0, 50) + "..." : content;
        }

        MessageType type = message.getMessageType();
        if (type == null) {
            return "Tin nhắn";
        }

        switch (type) {
            case IMAGE:
                return "📷 Hình ảnh";
            case VIDEO:
                return "🎥 Video";
            case FILE:
                return "📎 Tệp đính kèm";
            case MIXED:
                return "📎 Tin nhắn có đính kèm";
            case TEXT:
            default:
                return "Tin nhắn";
        }
    }

    private String generateParticipantHash(List<String> ids) {
        StringJoiner joiner = new StringJoiner("_");
        ids.forEach(joiner::add);
        return joiner.toString();
    }

    public String getCurrentUserId() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}