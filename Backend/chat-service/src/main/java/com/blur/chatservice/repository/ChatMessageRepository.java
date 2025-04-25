package com.blur.chatservice.repository;

import com.blur.chatservice.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findBySenderIdAndReceiverIdOrReceiverIdAndSenderIdOrderByTimestampDesc(
            String senderId1, String receiverId1,
            String senderId2, String receiverId2
    );
}
