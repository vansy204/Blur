package com.blur.chatservice.repository.httpclient;

import com.blur.chatservice.dto.request.AiChatRequest;
import com.blur.chatservice.dto.response.AiChatResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "ai-service",
        url = "${app.services.ai.url}"
)

public interface AiServiceClient {

    @PostMapping("/chat")
    AiChatResponse chat(@RequestBody AiChatRequest request);
}
