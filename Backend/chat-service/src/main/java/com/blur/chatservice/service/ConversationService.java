package com.blur.chatservice.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.stream.Collectors;

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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {
    ConversationMapper conversationMapper;
    ProfileClient profileClient;
    private final ConversationRepository conversationRepository;

    public List<ConversationResponse> myConversations() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userResponse = profileClient.getProfile(userId);
        List<Conversation> conversations = conversationRepository.findAllByParticipantIdsContains(
                userResponse.getResult().getUserId());

        return conversations.stream().map(this::toConversationResponse).collect(Collectors.toList());
    }

    public ConversationResponse createConversation(ConversationRequest request) {
        // fetch user infos
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userInfoResponse = profileClient.getProfile(userId);
        var participantInfoResponse =
                profileClient.getProfile(request.getParticipantIds().get(0));

        if (Objects.isNull(userInfoResponse) || Objects.isNull(participantInfoResponse)) {
            throw new AppException(ErrorCode.USER_PROFILE_NOT_FOUND);
        }

        var userInfo = userInfoResponse.getResult();
        var participantInfo = participantInfoResponse.getResult();

        List<String> userIds = new ArrayList<>();
        userIds.add(userId);
        userIds.add(participantInfo.getUserId());

        var sortedIds = userIds.stream().sorted().toList(); // sap xep lai theo thu tu de dam bao Hash la duy nhat

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
                    // build conversation info
                    Conversation newConversation = Conversation.builder()
                            .type(request.getType())
                            .participantsHash(userIdHash)
                            .createdDate(Instant.now())
                            .modifiedDate(Instant.now())
                            .participants(participantInfos)
                            .build();
                    return conversationRepository.save(newConversation);
                });
        return toConversationResponse(conversation);
    }

    private String generateParticipantHash(List<String> ids) {
        StringJoiner joiner = new StringJoiner("_");
        ids.forEach(joiner::add);
        return joiner.toString();
    }

    private ConversationResponse toConversationResponse(Conversation conversation) {
        String currentUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();
        var profileResponse = profileClient.getProfile(currentUserId);
        ConversationResponse conversationResponse = conversationMapper.toConversationResponse(conversation);

        conversation.getParticipants().stream()
                .filter(participantInfo -> !participantInfo
                        .getUserId()
                        .equals(profileResponse.getResult().getUserId()))
                .findFirst()
                .ifPresent(participantInfo -> {
                    conversationResponse.setConversationName(
                            participantInfo.getFirstName() + " " + participantInfo.getLastName());
                    conversationResponse.setConversationAvatar(participantInfo.getAvatar());
                });

        return conversationResponse;
    }

    public String deleteConversation(String conversationId) {
        conversationRepository.deleteById(conversationId);
        return "Deleted conversation successfully";
    }
}
