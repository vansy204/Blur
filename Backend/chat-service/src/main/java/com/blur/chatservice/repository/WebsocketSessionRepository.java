package com.blur.chatservice.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.blur.chatservice.entity.WebsocketSession;

@Repository
public interface WebsocketSessionRepository extends MongoRepository<WebsocketSession, String> {
    void deleteBySocketSessionId(String sessionId);

    List<WebsocketSession> findALlByUserIdIn(List<String> userIds);
}
