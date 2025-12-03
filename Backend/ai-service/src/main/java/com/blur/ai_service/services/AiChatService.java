package com.blur.ai_service.service;

import com.blur.ai_service.config.OpenAiConfig;
import com.blur.ai_service.dto.ChatRequest;
import com.blur.ai_service.dto.ChatResponse;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final OpenAiService openAiService;
    private final OpenAiConfig openAiConfig;

    public ChatResponse chat(ChatRequest request) {
        try {
            log.info("Xử lý chat request: {}", request.getMessage());

            ChatMessage message = new ChatMessage("user", request.getMessage());

            ChatCompletionRequest completionRequest = ChatCompletionRequest.builder()
                    .model(openAiConfig.getModel())
                    .messages(List.of(message))
                    .maxTokens(openAiConfig.getMaxTokens())
                    .temperature(openAiConfig.getTemperature())
                    .build();

            String aiResponse = openAiService
                    .createChatCompletion(completionRequest)
                    .getChoices()
                    .get(0)
                    .getMessage()
                    .getContent();

            log.info("Nhận response từ AI thành công");

            return ChatResponse.builder()
                    .response(aiResponse)
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi gọi OpenAI API", e);
            return ChatResponse.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }
}