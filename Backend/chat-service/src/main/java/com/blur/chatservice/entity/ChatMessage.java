package com.blur.chatservice.entity;

import java.time.Instant;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.blur.chatservice.enums.MessageStatus;

import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.MongoId;

@Document(collection = "chat_messages")
@Builder
@Data
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ChatMessage {
    @MongoId
    String id;
    @Indexed
    String conversationId;

    String message;
    ParticipantInfo sender;
    @Indexed
    Instant createdDate;

}
