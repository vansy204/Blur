package com.postservice.configuration;

import java.time.Duration;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableCaching
@ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis", matchIfMissing = false)
public class RedisConfig {

    /**
     * ObjectMapper cho Redis - Simple & Reliable
     */
    private ObjectMapper createRedisObjectMapper() {
        return JsonMapper.builder()
                .addModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();
        template.setKeySerializer(keySerializer);
        template.setHashKeySerializer(keySerializer);

        // Custom serializer
        CustomRedisSerializer valueSerializer = new CustomRedisSerializer(createRedisObjectMapper());
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);

        template.afterPropertiesSet();

        log.info("✅ RedisTemplate configured successfully for Post Service");
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        CustomRedisSerializer serializer = new CustomRedisSerializer(createRedisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new StringRedisSerializer()
                        )
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(serializer)
                )
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                // Post caches
                .withCacheConfiguration("posts",
                        defaultConfig.entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration("postsByUser",
                        defaultConfig.entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration("savedPosts",
                        defaultConfig.entryTtl(Duration.ofMinutes(20)))
                // Interaction caches
                .withCacheConfiguration("comments",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("postLikes",
                        defaultConfig.entryTtl(Duration.ofMinutes(5)))
                // Comment reply caches
                .withCacheConfiguration("commentReplies",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("commentReplyById",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .withCacheConfiguration("nestedReplies",
                        defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .transactionAware()
                .build();
    }

    /**
     * Custom Redis Serializer - Handles serialization/deserialization
     * Simple & Reliable - Works với DevTools
     */
    static class CustomRedisSerializer implements org.springframework.data.redis.serializer.RedisSerializer<Object> {

        private final ObjectMapper objectMapper;

        public CustomRedisSerializer(ObjectMapper objectMapper) {
            this.objectMapper = objectMapper;
        }

        @Override
        public byte[] serialize(Object value) throws org.springframework.data.redis.serializer.SerializationException {
            if (value == null) {
                return new byte[0];
            }
            try {
                return objectMapper.writeValueAsBytes(value);
            } catch (Exception e) {
                log.error("❌ Serialize error: {}", e.getMessage(), e);
                throw new org.springframework.data.redis.serializer.SerializationException(
                        "Could not serialize: " + e.getMessage(), e
                );
            }
        }

        @Override
        public Object deserialize(byte[] bytes) throws org.springframework.data.redis.serializer.SerializationException {
            if (bytes == null || bytes.length == 0) {
                return null;
            }
            try {
                return objectMapper.readValue(bytes, Object.class);
            } catch (Exception e) {
                log.error("❌ Deserialize error: {}", e.getMessage(), e);
                // Graceful degradation - return null instead of throwing
                return null;
            }
        }
    }
}