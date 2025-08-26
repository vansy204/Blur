package com.blur.chatservice.dto.response;

import com.blur.chatservice.entity.ParticipantInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ChatMessageResponse {
    String id;
    String conversationId;
    Boolean me;
    String message;
    ParticipantInfo sender;
    Instant createdDate;
}
