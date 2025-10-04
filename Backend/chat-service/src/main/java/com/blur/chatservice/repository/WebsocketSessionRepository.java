package com.blur.chatservice.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.blur.chatservice.entity.WebsocketSession;

@Repository
public interface WebsocketSessionRepository extends MongoRepository<WebsocketSession, String> {
    /**
     * Delete session by socket session ID
     */
    void deleteBySocketSessionId(String socketSessionId);

    /**
     * Find all sessions for multiple users (for group chat or 1-1 chat)
     * ⚠️ LƯU Ý: Tên method có typo "ALl" thay vì "All" - giữ nguyên để match với code hiện tại
     */
    List<WebsocketSession> findALlByUserIdIn(List<String> userIds);

    /**
     * Find all sessions by user ID (cần cho typing indicator và presence)
     */
    List<WebsocketSession> findByUserId(String userId);

}
