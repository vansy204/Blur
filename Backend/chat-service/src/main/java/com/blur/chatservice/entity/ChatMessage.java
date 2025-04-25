package com.blur.chatservice.entity;

import com.blur.chatservice.enums.MessageStatus;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.Date;

@Document(collection = "chat_messages")
@Builder
@Data
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ChatMessage {
    @Id
    String id;
    String senderId;
    String receiverId;
    String content;
    LocalDateTime timestamp;
    MessageStatus status;
}
