package org.identityservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication(
        exclude = {
                // Exclude Redis auto-config nếu cần tự config
                RedisAutoConfiguration.class,
                RedisRepositoriesAutoConfiguration.class
        },
        scanBasePackages = {
                "org.IdentityService",
                "com.blur.commonlibrary"  // Scan common-library explicitly
        }
)
@EnableFeignClients
public class IdentityServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(IdentityServiceApplication.class, args);
    }
}