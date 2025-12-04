package com.blur.ai_service.services;

import com.blur.ai_service.config.OpenAiConfig;
import com.blur.ai_service.dto.ChatRequest;
import com.blur.ai_service.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final OpenAiConfig openAiConfig;
    private final RestTemplate restTemplate = new RestTemplate();

    public ChatResponse chat(ChatRequest request) {
        try {
            log.info("Xử lý chat request: {}", request.getMessage());

            // Thêm API key vào URL
            String url = openAiConfig.getBaseUrl() + "/" +
                    openAiConfig.getCompletionsPath() +
                    "?key=" + openAiConfig.getApiKey();

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", request.getMessage())
                            ))
                    )
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            Map<String, Object> responseBody = response.getBody();
            String aiResponse = extractTextFromResponse(responseBody);

            log.info("Nhận response từ Gemini thành công");

            return ChatResponse.builder()
                    .response(aiResponse)
                    .success(true)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi gọi Gemini API", e);
            return ChatResponse.builder()
                    .success(false)
                    .error(e.getMessage())
                    .build();
        }
    }

    private String extractTextFromResponse(Map<String, Object> response) {
        try {
            List<Map> candidates = (List<Map>) response.get("candidates");
            Map content = (Map) candidates.get(0).get("content");
            List<Map> parts = (List<Map>) content.get("parts");
            return (String) parts.get(0).get("text");
        } catch (Exception e) {
            return "Không thể parse response";
        }
    }
}