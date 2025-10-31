package com.blur.commonlibrary.config;

import com.blur.commonlibrary.constant.CacheConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.redis.advanced-cache.enabled", havingValue = "true", matchIfMissing = true)
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class CacheConfig {
    RedisProperties redisProperties;

    @Bean("customCacheManager")
    @Primary
    public RedisCacheManager customCacheManager(
            RedisConnectionFactory connectionFactory,
            ObjectMapper redisObjectMapper) {

        log.info("Configuring Custom CacheManager with per-cache TTL");

        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(redisObjectMapper);

        // Base configuration
        RedisCacheConfiguration baseConfig = RedisCacheConfiguration
                .defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(jsonSerializer))
                .disableCachingNullValues()
                .computePrefixWith(cacheName -> {
                    String prefix = redisProperties.getKeyPrefix();
                    if (prefix != null && !prefix.isEmpty()) {
                        return prefix + ":cache:" + cacheName + "::";
                    }
                    return "cache:" + cacheName + "::";
                });

        // Custom TTL cho từng cache
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();


        // IDENTITY SERVICE
        cacheConfigurations.put(CacheConstants.IDENTITY_USER,
                baseConfig.entryTtl(Duration.ofSeconds(redisProperties.getCacheTtl().getMediumTtl())));
        cacheConfigurations.put(CacheConstants.IDENTITY_USER_INFO,
                baseConfig.entryTtl(Duration.ofSeconds(redisProperties.getCacheTtl().getMediumTtl())));
        cacheConfigurations.put(CacheConstants.IDENTITY_USERS,
                baseConfig.entryTtl(Duration.ofSeconds(redisProperties.getCacheTtl().getMediumTtl())));
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(baseConfig.entryTtl(Duration.ofSeconds(redisProperties.getCacheTtl().getDefaultTtl())))
                .withInitialCacheConfigurations(cacheConfigurations)
                .transactionAware()
                .build();
    }
}
