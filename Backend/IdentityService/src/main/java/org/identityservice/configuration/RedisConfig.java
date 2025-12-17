package org.identityservice.configuration;

import java.time.Duration;

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

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableCaching
public class RedisConfig {

    /**
     * ObjectMapper for Redis serialization with proper type handling
     */
    private ObjectMapper createRedisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // Register JavaTimeModule for LocalDateTime, Instant, etc.
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

        // Deserialization settings - be lenient
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.configure(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES, false);
        mapper.configure(DeserializationFeature.FAIL_ON_MISSING_CREATOR_PROPERTIES, false);

        // Enable default typing for polymorphism - EVERYTHING to ensure all types are
        // preserved
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.EVERYTHING, JsonTypeInfo.As.PROPERTY);

        log.info("✅ Redis ObjectMapper configured with EVERYTHING typing");
        return mapper;
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();
        template.setKeySerializer(keySerializer);
        template.setHashKeySerializer(keySerializer);

        // Use GenericJackson2JsonRedisSerializer with our custom ObjectMapper
        GenericJackson2JsonRedisSerializer valueSerializer =
                new GenericJackson2JsonRedisSerializer(createRedisObjectMapper());
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);

        template.afterPropertiesSet();

        log.info("✅ RedisTemplate configured with GenericJackson2JsonRedisSerializer");
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(createRedisObjectMapper());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(serializer))
                .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withCacheConfiguration("users", defaultConfig.entryTtl(Duration.ofMinutes(30)))
                .withCacheConfiguration("userById", defaultConfig.entryTtl(Duration.ofMinutes(15)))
                .withCacheConfiguration("myInfo", defaultConfig.entryTtl(Duration.ofMinutes(10)))
                .transactionAware()
                .build();
    }
}
