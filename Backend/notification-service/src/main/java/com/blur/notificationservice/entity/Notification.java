package com.blur.notificationservice.entity;


import com.blur.notificationservice.kafka.model.Type;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.FieldName;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Notification {
    @Id
    String id;
    String senderId;
    String senderName;
    String receiverId;
    String receiverName;
    String receiverEmail;
    String senderImageUrl;
    Type type;
    String content;
    LocalDateTime timestamp;
    Boolean read = false;

}
