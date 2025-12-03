package com.blur.ai_service.config;

import com.theokanning.openai.service.OpenAiService;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class OpenAiConfig {

    @Value("${openai.api-key}")
    private String apiKey;

    @Getter
    @Value("${openai.model}")
    private String model;

    @Getter
    @Value("${openai.max-tokens}")
    private Integer maxTokens;

    @Getter
    @Value("${openai.temperature}")
    private Double temperature;

    @Bean
    public OpenAiService openAiService() {
        return new OpenAiService(apiKey, Duration.ofSeconds(60));
    }

}