// Conversation.java
package com.blur.chatservice.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "conversations")
public class Conversation {
    @Id
     String id;
     List<String> participants;
     String lastMessageContent;
     String lastMessageSenderId;
     Instant lastMessageTimestamp;
     Instant createdAt;
}