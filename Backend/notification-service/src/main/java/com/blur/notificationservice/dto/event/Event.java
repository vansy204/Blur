package com.blur.notificationservice.dto.event;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Event {
    String postId;
    String senderId;
    String senderName;
    String senderFirstName;
    String senderLastName;
    String receiverId;
    String receiverEmail;
    String receiverName;
    LocalDateTime timestamp;
}
