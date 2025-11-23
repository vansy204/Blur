package com.postservice.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {

        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        template.setKeySerializer(stringSerializer);
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setHashValueSerializer(jsonSerializer);

        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {

        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer())
                )
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(serializer)
                )
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(5));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // ==================== POST CACHES ====================
        cacheConfigurations.put("posts",
                defaultConfig.entryTtl(Duration.ofMinutes(2)));

        cacheConfigurations.put("post",
                defaultConfig.entryTtl(Duration.ofMinutes(5)));

        cacheConfigurations.put("userPosts",
                defaultConfig.entryTtl(Duration.ofMinutes(5)));

        cacheConfigurations.put("postLikes",
                defaultConfig.entryTtl(Duration.ofMinutes(3)));

        // ==================== SAVED POST CACHES ====================
        // Saved posts ít thay đổi, TTL dài hơn
        cacheConfigurations.put("savedPosts",
                defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // ==================== COMMENT CACHES ====================
        // Comments thay đổi thường xuyên (user có thể comment liên tục)
        cacheConfigurations.put("comments",
                defaultConfig.entryTtl(Duration.ofMinutes(3)));

        // Comment replies (nested structure)
        cacheConfigurations.put("commentReplies",
                defaultConfig.entryTtl(Duration.ofMinutes(3)));

        // Nested replies (replies to replies)
        cacheConfigurations.put("nestedReplies",
                defaultConfig.entryTtl(Duration.ofMinutes(3)));

        // Single comment/reply by ID (dùng cho edit/delete)
        cacheConfigurations.put("commentReplyById",
                defaultConfig.entryTtl(Duration.ofMinutes(5)));

        // ==================== PROFILE CACHE ====================
        cacheConfigurations.put("profiles",
                defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}