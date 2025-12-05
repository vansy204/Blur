package com.blur.ai_service.services;

import com.blur.ai_service.dto.ChatRequest;
import com.blur.ai_service.dto.ChatResponse;
import com.blur.ai_service.entity.ChatMessage;
import com.blur.ai_service.entity.Conversation;
import com.blur.ai_service.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final AiChatService aiChatService;              // service gọi Gemini
    private final ConversationRepository repository;        // MongoDB

    public ChatResponse chat(ChatRequest request) {

        Conversation conversation;

        // Nếu request không có conversationId → tạo mới
        if (request.getConversationId() == null || request.getConversationId().isEmpty()) {
            conversation = new Conversation();
            conversation.setUserId(request.getUserId());
            conversation.setCreatedAt(Instant.now());
            conversation.setMessages(new ArrayList<>());
        } else {
            conversation = repository.findById(request.getConversationId())
                    .orElseThrow(); // có thể thay bằng exception riêng
        }

        // Lưu message của user
        ChatMessage userMsg = new ChatMessage();
        userMsg.setRole("user");
        userMsg.setContent(request.getMessage());
        userMsg.setTimestamp(Instant.now());
        conversation.getMessages().add(userMsg);

        // Gọi AI (Gemini)
        ChatResponse aiResult = aiChatService.chat(request);
        String reply = aiResult.getResponse();

        // Nếu call AI lỗi thì vẫn lưu history, nhưng trả lỗi ra ngoài
        if (!aiResult.isSuccess()) {
            ChatMessage aiError = new ChatMessage();
            aiError.setRole("assistant");
            aiError.setContent("AI error: " + aiResult.getError());
            aiError.setTimestamp(Instant.now());
            conversation.getMessages().add(aiError);

            conversation.setUpdatedAt(Instant.now());
            conversation = repository.save(conversation);

            return ChatResponse.builder()
                    .conversationId(conversation.getId())
                    .response(aiError.getContent())
                    .success(false)
                    .error(aiResult.getError())
                    .build();
        }

        // Lưu message AI
        ChatMessage aiMsg = new ChatMessage();
        aiMsg.setRole("assistant");
        aiMsg.setContent(reply);
        aiMsg.setTimestamp(Instant.now());
        conversation.getMessages().add(aiMsg);

        // Update DB
        conversation.setUpdatedAt(Instant.now());
        conversation = repository.save(conversation);

        // Trả response
        return ChatResponse.builder()
                .conversationId(conversation.getId())
                .response(reply)
                .success(true)
                .build();
    }
}
