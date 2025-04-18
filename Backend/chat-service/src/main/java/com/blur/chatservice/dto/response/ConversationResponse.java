package com.blur.chatservice.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {
    String id;
    List<String> participants;
    String lastMessageContent;
    String lastMessageSenderId;
    Instant lastMessageTimestamp;
    Integer unreadCount;
}
