package com.blur.notificationservice.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJsonMessageConverter;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
public class KafkaConfig {
    @Bean
    public DefaultErrorHandler errorHandler() {
        // Cấu hình retry 3 lần, mỗi lần cách nhau 1 giây
        FixedBackOff fixedBackOff = new FixedBackOff(1000L, 3);
        return new DefaultErrorHandler((record, exception) -> {
            if (record != null) {
                System.err.println("Error processing message: " + record.value());
            } else {
                System.err.println("Error: record is null.");
            }
            exception.printStackTrace();
        }, fixedBackOff);

    }

    @Bean
    public RecordMessageConverter converter() {
        return new StringJsonMessageConverter();
    }
}
