package com.blur.notificationservice.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RedisService{
    RedisTemplate<String, String> redisTemplate;
    public void setUserOnline(String userId) {
        redisTemplate.opsForValue().set("online:" + userId, "true", 10, TimeUnit.MINUTES);
    }

    public void setUserOffline(String userId) {
        redisTemplate.delete("online:" + userId);
    }
    public boolean isOnline(String userId){
        return Boolean.TRUE.equals(redisTemplate.hasKey("online:" + userId));
    }

}
