package org.identityservice.service;

import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RedisService {
    RedisTemplate<String, String> redisTemplate;

    public void setOnline(String userId) {
        redisTemplate.opsForValue().set("online " + userId, "true", Duration.ofMinutes(30));
    }

    public void setOffline(String userId) {
        redisTemplate.delete("online " + userId);
    }

    public boolean isOnline(String userId) {
        return Boolean.TRUE.equals(redisTemplate.hasKey("online" + userId));
    }
}
