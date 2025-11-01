package com.blur.commonlibrary.config;


import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.pool2.impl.GenericObjectPoolConfig;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettucePoolingClientConfiguration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import javax.naming.Name;
import java.time.Duration;

@Slf4j
@Configuration
@EnableCaching
@EnableConfigurationProperties(RedisProperties.class)
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RedisConfig {
    RedisProperties redisProperties;


    @Bean
    @ConditionalOnMissingBean(RedisProperties.class) // ⭐ Chỉ tạo nếu chưa có bean
    public RedisProperties redisProperties() {
        return new RedisProperties();
    }

    @Bean
    @ConditionalOnMissingBean(RedisConnectionFactory.class)
    public LettuceConnectionFactory redisConnectionFactory() {

        //config
        RedisStandaloneConfiguration redisConfig = new RedisStandaloneConfiguration();
        redisConfig.setPort(redisProperties.getPort());
        redisConfig.setHostName(redisProperties.getHost());
        redisConfig.setDatabase(redisProperties.getDatabase());
        if (redisProperties.getPassword() != null && !redisProperties.getPassword().isEmpty())  {
            redisConfig.setPassword(redisProperties.getPassword());
        }


        LettuceClientConfiguration clientConfig = LettucePoolingClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(redisProperties.getTimeout()))
                .poolConfig(new GenericObjectPoolConfig() {{
                    setMaxTotal(redisProperties.getPool().getMaxActive());
                    setMaxIdle(redisProperties.getPool().getMaxIdle());
                    setMinIdle(redisProperties.getPool().getMinIdle());
                    setMaxWait(Duration.ofMillis(redisProperties.getPool().getMaxWait()));
                    setTestOnBorrow(true);
                    setTestOnReturn(true);
                    setTestWhileIdle(true);
                }})
                .build();
        LettuceConnectionFactory factory = new LettuceConnectionFactory(redisConfig);
        factory.afterPropertiesSet();
        return factory;
    }


    @Bean
    @ConditionalOnMissingBean(name = "redisObjectMapper")
    public ObjectMapper redisObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();


        // support java 8 date/time
        mapper.registerModule(new JavaTimeModule());

        return mapper;
    }

    @Bean
    @ConditionalOnMissingBean(name = "redisTemplate")
    public RedisTemplate<String,Object> redisTemplate(
            RedisConnectionFactory redisConnectionFactory,
            ObjectMapper objectMapper
    ){
        RedisTemplate<String,Object> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(redisConnectionFactory);

        //key serialization
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonRedisSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);

        // apply key prefix
        if(redisProperties.getKeyPrefix() != null && !redisProperties.getKeyPrefix().isEmpty()) {
            redisTemplate.setKeySerializer(new PrefixedStringRedisSerializer(redisProperties.getKeyPrefix()));
        }else{
            redisTemplate.setKeySerializer(stringRedisSerializer);
        }
        redisTemplate.setValueSerializer(jsonRedisSerializer);
        redisTemplate.setHashKeySerializer(stringRedisSerializer);
        redisTemplate.setHashValueSerializer(jsonRedisSerializer);
        redisTemplate.afterPropertiesSet();
        return redisTemplate;
    }
    private static class PrefixedStringRedisSerializer extends StringRedisSerializer {
        private final String prefix;

        public PrefixedStringRedisSerializer(String prefix) {
            this.prefix = prefix + ":";
        }

        @Override
        public String deserialize(byte[] bytes) {
            String key = super.deserialize(bytes);
            if (key.startsWith(prefix)) {
                return key.substring(prefix.length());
            }
            return key;
        }

        @Override
        public byte[] serialize(String string) {
            if (string == null) {
                return super.serialize(null);
            }
            return super.serialize(prefix + string);
        }
    }

    @Bean
    @ConditionalOnMissingBean(name = "cacheManager")
    public RedisCacheManager cacheManager(
            RedisConnectionFactory redisConnectionFactory,
            ObjectMapper objectMapper
    ) {
        GenericJackson2JsonRedisSerializer jsonSerializer =
                new GenericJackson2JsonRedisSerializer(objectMapper);
        //default cache config
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofSeconds(redisProperties.getCacheTtl().getDefaultTtl()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(jsonSerializer))
                .disableCachingNullValues()
                .computePrefixWith(cacheName -> {
                    String prefix = redisProperties.getKeyPrefix();
                    if(prefix != null && !prefix.isEmpty()){
                        return prefix + ":cache:" + cacheName +"::";
                    }
                    return "cache:" + cacheName +"::";
                });
        RedisCacheManager.RedisCacheManagerBuilder builder = RedisCacheManager
                .builder(redisConnectionFactory)
                .cacheDefaults(config)
                .transactionAware(); // dong bo voi transaction in db
        return builder.build();
    }

}
