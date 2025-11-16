package com.blur.chatservice.entity;

import com.blur.chatservice.enums.CallStatus;
import com.blur.chatservice.enums.CallType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "call_sessions")
@NoArgsConstructor
@AllArgsConstructor
public class CallSession {

    @Id
    String id;

    String callerId;
    String callerName;
    String callerAvatar;

    String receiverId;
    String receiverName;
    String receiverAvatar;

    CallType callType;
    CallStatus callStatus;

    LocalDateTime createdAt;
    LocalDateTime startTime;
    LocalDateTime endTime;
    Long duration;

    // socketIds
    String callerSockerId;
    String receiverSockerId;

    String conversationId;
    String endReason;

}
