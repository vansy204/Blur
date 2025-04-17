package com.blur.chatservice.repository;

import com.blur.chatservice.entity.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    @Query("{'participants': {$all: ?0}}")
    Optional<Conversation> findByParticipants(List<String> participants);

    @Query("{'participants': ?0}")
    List<Conversation> findAllByParticipantId(String userId);

}
