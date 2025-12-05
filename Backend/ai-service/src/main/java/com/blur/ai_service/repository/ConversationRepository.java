package com.blur.ai_service.repository;

import com.blur.ai_service.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ConversationRepository extends MongoRepository<Conversation, String> {

    List<Conversation> findByUserIdOrderByUpdatedAtDesc(String userId);
}
