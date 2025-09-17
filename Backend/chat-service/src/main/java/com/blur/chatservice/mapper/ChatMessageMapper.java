package com.blur.chatservice.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.blur.chatservice.dto.request.ChatMessageRequest;
import com.blur.chatservice.dto.response.ChatMessageResponse;
import com.blur.chatservice.entity.ChatMessage;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage);

    ChatMessage toChatMessage(ChatMessageRequest chatMessageRequest);

    List<ChatMessageResponse> toChatMessageResponses(List<ChatMessageResponse> chatMessageResponses);
}
