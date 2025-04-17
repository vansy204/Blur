package com.blur.chatservice.service;

import com.blur.chatservice.dto.request.MessageRequest;
import com.blur.chatservice.dto.response.ConversationResponse;
import com.blur.chatservice.dto.response.MessageResponse;
import com.blur.chatservice.entity.Conversation;
import com.blur.chatservice.entity.Message;
import com.blur.chatservice.repository.ConversationRepository;
import com.blur.chatservice.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final SimpMessagingTemplate messagingTemplate;


    public MessageResponse sendMessage(MessageRequest messageRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String senderId = authentication.getName();
        String recipientId = messageRequest.getRecipientId();

        // Find or create conversation
        List<String> participants = Arrays.asList(senderId, recipientId);
        participants.sort(String::compareTo); // Sort to ensure consistent lookup

        Conversation conversation = conversationRepository.findByParticipants(participants)
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .participants(participants)
                            .createdAt(Instant.now())
                            .build();
                    return conversationRepository.save(newConversation);
                });

        // Create and save message
        Instant now = Instant.now();
        Message message = Message.builder()
                .senderId(senderId)
                .content(messageRequest.getContent())
                .conversationId(conversation.getId())
                .read(false)
                .timestamp(now)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Update conversation with last message info
        conversation.setLastMessageContent(message.getContent());
        conversation.setLastMessageSenderId(senderId);
        conversation.setLastMessageTimestamp(now);
        conversationRepository.save(conversation);

        // Create response
        MessageResponse response = MessageResponse.builder()
                .id(savedMessage.getId())
                .senderId(savedMessage.getSenderId())
                .content(savedMessage.getContent())
                .conversationId(savedMessage.getConversationId())
                .isRead(savedMessage.getRead())
                .timestamp(savedMessage.getTimestamp())
                .build();

        // Send real-time update via WebSocket
        messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/messages",
                response
        );

        return response;
    }

    /**
     * Processes messages received through WebSocket connections.
     * This method handles the authentication, saves the message, and notifies
     * the recipient in real-time.
     *
     * @param messageRequest The message request containing content and recipient information
     */
    public void processMessage(MessageRequest messageRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String senderId = authentication.getName();
        String recipientId = messageRequest.getRecipientId();
        
        // Find or create conversation
        List<String> participants = Arrays.asList(senderId, recipientId);
        participants.sort(String::compareTo); // Sort to ensure consistent lookup
        
        Conversation conversation = conversationRepository.findByParticipants(participants)
                .orElseGet(() -> {
                    Conversation newConversation = Conversation.builder()
                            .participants(participants)
                            .createdAt(Instant.now())
                            .build();
                    return conversationRepository.save(newConversation);
                });
        
        // Create and save message
        Instant now = Instant.now();
        Message message = Message.builder()
                .senderId(senderId)
                .content(messageRequest.getContent())
                .conversationId(conversation.getId())
                .read(false)
                .timestamp(now)
                .build();
        
        Message savedMessage = messageRepository.save(message);
        
        // Update conversation with last message info
        conversation.setLastMessageContent(message.getContent());
        conversation.setLastMessageSenderId(senderId);
        conversation.setLastMessageTimestamp(now);
        conversationRepository.save(conversation);
        
        // Create response
        MessageResponse response = MessageResponse.builder()
                .id(savedMessage.getId())
                .senderId(savedMessage.getSenderId())
                .content(savedMessage.getContent())
                .conversationId(savedMessage.getConversationId())
                .isRead(savedMessage.getRead())
                .timestamp(savedMessage.getTimestamp())
                .build();
        
        // Send real-time update via WebSocket to the recipient
        messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/messages",
                response
        );
        
        // Send notification to the recipient about new message
        messagingTemplate.convertAndSendToUser(
                recipientId,
                "/queue/notifications",
                createNotification(senderId, messageRequest.getContent())
        );
        
        // Also send response to the sender for confirmation
        messagingTemplate.convertAndSendToUser(
                senderId,
                "/queue/sent",
                response
        );
    }

    /**
     * Creates a notification object for real-time updates
     */
    private Map<String, Object> createNotification(String senderId, String content) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "NEW_MESSAGE");
        notification.put("senderId", senderId);
        notification.put("content", content.length() > 30 
                ? content.substring(0, 27) + "..." 
                : content);
        notification.put("timestamp", Instant.now().toString());
        return notification;
    }
    
    public List<MessageResponse> getConversationMessages(String conversationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        if (!conversation.getParticipants().contains(userId)) {
            throw new RuntimeException("User not authorized to access this conversation");
        }
        
        // Mark messages as read
        List<Message> unreadMessages = messageRepository.findBySenderIdAndConversationIdAndReadFalse(
                getOtherParticipant(conversation, userId), conversationId);
        
        unreadMessages.forEach(message -> message.setRead(true));
        messageRepository.saveAll(unreadMessages);
        
        // Get all messages in conversation
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId)
                .stream()
                .map(message -> MessageResponse.builder()
                        .id(message.getId())
                        .senderId(message.getSenderId())
                        .content(message.getContent())
                        .conversationId(message.getConversationId())
                        .isRead(message.getRead())
                        .timestamp(message.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }
    
    public List<ConversationResponse> getUserConversations() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        return conversationRepository.findAllByParticipantId(userId)
                .stream()
                .map(conversation -> {
                    int unreadCount = (int) messageRepository
                            .findBySenderIdAndConversationIdAndReadFalse(
                                    getOtherParticipant(conversation, userId), 
                                    conversation.getId())
                            .size();
                    
                    return ConversationResponse.builder()
                            .id(conversation.getId())
                            .participants(conversation.getParticipants())
                            .lastMessageContent(conversation.getLastMessageContent())
                            .lastMessageSenderId(conversation.getLastMessageSenderId())
                            .lastMessageTimestamp(conversation.getLastMessageTimestamp())
                            .unreadCount(unreadCount)
                            .build();
                })
                .collect(Collectors.toList());
    }
    
    private String getOtherParticipant(Conversation conversation, String userId) {
        return conversation.getParticipants().stream()
                .filter(id -> !id.equals(userId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Other participant not found"));
    }
    
    public void markConversationAsRead(String conversationId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();
        
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        
        if (!conversation.getParticipants().contains(userId)) {
            throw new RuntimeException("User not authorized to access this conversation");
        }
        
        String otherParticipant = getOtherParticipant(conversation, userId);
        List<Message> unreadMessages = messageRepository
                .findBySenderIdAndConversationIdAndReadFalse(otherParticipant, conversationId);
        
        unreadMessages.forEach(message -> message.setRead(true));
        messageRepository.saveAll(unreadMessages);
    }
}