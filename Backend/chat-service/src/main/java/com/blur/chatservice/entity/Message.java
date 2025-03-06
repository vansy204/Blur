package com.blur.chatservice.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "messages")
public class Message {
    @Id
    String id;
    String senderId;
    String receiverId;
    String content;
    Date timestamp;
}
