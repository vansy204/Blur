package com.blur.chatservice.repository;

import com.blur.chatservice.entity.WebsocketSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WebsocketSessionRepository extends MongoRepository<WebsocketSession, String> {
    void deleteBySocketSessionId(String sessionId);
    List<WebsocketSession> findALlByUserIdIn(List<String> userIds);
}
