package com.blur.notificationservice.dto.event;

import com.blur.notificationservice.kafka.model.Type;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
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
