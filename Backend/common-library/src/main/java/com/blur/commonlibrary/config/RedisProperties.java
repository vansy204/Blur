package com.blur.commonlibrary.config;


import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.redis")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RedisProperties {
    String host = "localhost";
    Integer port = 6379;
    String password;
    int database = 0;
    int timeout = 3000;
    String keyPrefix;
     Pool pool = new Pool();
     CacheTtl cacheTtl = new CacheTtl();
    @Data
    public static class CacheTtl {
         long defaultTtl = 600;
         long shortTtl = 300;
         long mediumTtl = 900;
         long longTtl = 1800;
         long veryLongTtl = 3600;
    }


    @Data
    public static class Pool{
         int maxActive = 20;
         int maxIdle = 10;
         int minIdle = 2;
         int maxWait = 3000;
    }

}

