package com.blur.chatservice.repository;

import com.blur.chatservice.entity.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(
            String sender1, String receiver1, String receiver2, String sender2);
}
