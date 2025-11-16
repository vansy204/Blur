package com.blur.chatservice.service;// RedisCacheService.java

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisCacheService {

    private final RedisTemplate<String, Object> redisTemplate;


    private static final String CALL_STATE_PREFIX = "call:state:";
    private static final String USER_CALL_PREFIX = "user:call:";
    private static final String CALL_HISTORY_PREFIX = "call:history:";
    private static final String MISSED_CALLS_PREFIX = "call:missed:";
    private static final String USER_STATUS_PREFIX = "user:status:";

    public void cacheCallSession(String callId, Object session, long ttlSeconds) {
        String key = CALL_STATE_PREFIX + callId;
        redisTemplate.opsForValue().set(key, session, ttlSeconds, TimeUnit.SECONDS);
        log.debug("Cached call session: {}, TTL: {}s", callId, ttlSeconds);
    }

    public <T> T getCallSession(String callId, Class<T> type) {
        String key = CALL_STATE_PREFIX + callId;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? type.cast(value) : null;
    }


    public void deleteCallSession(String callId) {
        String key = CALL_STATE_PREFIX + callId;
        redisTemplate.delete(key);
        log.debug("Deleted call session cache: {}", callId);
    }

    public void markUserInCall(String userId, String callId, long ttlSeconds) {
        String key = USER_CALL_PREFIX + userId;
        redisTemplate.opsForValue().set(key, callId, ttlSeconds, TimeUnit.SECONDS);
        log.debug("Marked user {} in call {}, TTL: {}s", userId, callId, ttlSeconds);
    }


    public boolean isUserInCall(String userId) {
        String key = USER_CALL_PREFIX + userId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public String getUserCurrentCallId(String userId) {
        String key = USER_CALL_PREFIX + userId;
        Object callId = redisTemplate.opsForValue().get(key);
        return callId != null ? callId.toString() : null;
    }
    public void removeUserFromCall(String userId) {
        String key = USER_CALL_PREFIX + userId;
        redisTemplate.delete(key);
    }
    public void cacheCallHistory(String userId, Object history, int page) {
        String key = CALL_HISTORY_PREFIX + userId + ":page:" + page;
        redisTemplate.opsForValue().set(key, history, 10, TimeUnit.MINUTES);
    }

    public <T> T getCallHistory(String userId, int page, Class<T> type) {
        String key = CALL_HISTORY_PREFIX + userId + ":page:" + page;
        Object value = redisTemplate.opsForValue().get(key);
        return value != null ? type.cast(value) : null;
    }

    public void invalidateCallHistory(String userId) {
        String pattern = CALL_HISTORY_PREFIX + userId + ":page:*";
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
    public void incrementMissedCalls(String userId) {
        String key = MISSED_CALLS_PREFIX + userId;
        redisTemplate.opsForValue().increment(key);
        redisTemplate.expire(key, 24, TimeUnit.HOURS);
    }

    public long getMissedCallCount(String userId) {
        String key = MISSED_CALLS_PREFIX + userId;
        Object count = redisTemplate.opsForValue().get(key);
        return count != null ? Long.parseLong(count.toString()) : 0;
    }

    public void resetMissedCalls(String userId) {
        String key = MISSED_CALLS_PREFIX + userId;
        redisTemplate.delete(key);
    }

    public void setUserOnlineStatus(String userId, boolean isOnline) {
        String key = USER_STATUS_PREFIX + userId;
        redisTemplate.opsForValue().set(key, isOnline ? "online" : "offline", 5, TimeUnit.MINUTES);
    }
    public boolean isUserOnline(String userId) {
        String key = USER_STATUS_PREFIX + userId;
        Object status = redisTemplate.opsForValue().get(key);
        return "online".equals(status);
    }

    public void cleanupCallCaches(String callId, String callerId, String receiverId) {
        deleteCallSession(callId);
        removeUserFromCall(callerId);
        removeUserFromCall(receiverId);

        // Invalidate call history caches
        invalidateCallHistory(callerId);
        invalidateCallHistory(receiverId);
    }

    public Set<String> getAllActiveCalls() {
        String pattern = CALL_STATE_PREFIX + "*";
        return redisTemplate.keys(pattern);
    }

    public Set<String> getAllUsersInCalls() {
        String pattern = USER_CALL_PREFIX + "*";
        return redisTemplate.keys(pattern);
    }
}