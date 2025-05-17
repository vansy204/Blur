package com.blur.notificationservice.dto.event;

import com.blur.notificationservice.kafka.model.Type;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Event {
    String senderId;
    String senderName;
    String receiverId;
    String receiverEmail;
    String receiverName;
    LocalDateTime timestamp;
}
