package com.blur.notificationservice.configuration;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonPrimitive;
import com.google.gson.JsonSerializer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.util.backoff.FixedBackOff;

import java.time.LocalDateTime;

@Configuration
@Slf4j
public class GsonConfig {
    @Bean
    public Gson gson() {
        return new GsonBuilder()
                .registerTypeAdapter(LocalDateTime.class, (JsonSerializer<LocalDateTime>) (src, typeOfSrc, context) ->
                        new JsonPrimitive(src.toString()))
                .create();
    }
    @Bean
    public DefaultErrorHandler errorHandler() {
        var backOff = new FixedBackOff(1000L, 0L); // Retry tối đa 3 lần, mỗi lần cách 1s
        // Có thể lưu vào DB để kiểm tra thủ công hoặc gửi alert
        return new DefaultErrorHandler((consumerRecord, exception) -> {
            log.error("Error processing message: {}", consumerRecord.value(), exception);
            // Có thể lưu vào DB để kiểm tra thủ công hoặc gửi alert
        }, backOff);
    }

}
