package com.blur.chatservice.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.blur.chatservice.dto.ApiResponse;
import com.blur.chatservice.dto.request.ConversationRequest;
import com.blur.chatservice.dto.response.ConversationResponse;
import com.blur.chatservice.service.ConversationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("conversations")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {
    ConversationService conversationService;

    @PostMapping("/create")
    ApiResponse<ConversationResponse> createConversation(@RequestBody ConversationRequest conversationRequest) {
        log.info("conversation create request {}", conversationRequest);
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.createConversation(conversationRequest))
                .build();
    }

    @GetMapping("/my-conversations")
    ApiResponse<List<ConversationResponse>> myConversations() {
        return ApiResponse.<List<ConversationResponse>>builder()
                .result(conversationService.myConversations())
                .build();
    }
}
