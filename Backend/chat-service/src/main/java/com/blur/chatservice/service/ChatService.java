package com.blur.chatservice.service;

import com.blur.chatservice.entity.ChatMessage;
import com.blur.chatservice.enums.MessageStatus;
import com.blur.chatservice.repository.ChatMessageRepository;
import com.blur.chatservice.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@EnableWebSocketMessageBroker
public class ChatService {
    ChatMessageRepository chatMessageRepository;

    public ChatMessage saveMessage(String senderId,String receivedId,String content){
        ChatMessage chatMessage = ChatMessage.builder()
                .senderId(senderId)
                .receiverId(receivedId)
                .content(content)
                .timestamp(LocalDateTime.now())
                .status(MessageStatus.SENT)
                .build();
        return chatMessageRepository.save(chatMessage);
    }
    public List<ChatMessage> getChatHistory(String senderId,String receivedId){
        return chatMessageRepository
                .findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
                        senderId,
                        receivedId,
                        senderId,
                        receivedId
                );
    }

}
