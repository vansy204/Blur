package com.blur.chatservice.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "websocket_session")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WebsocketSession {
    @Id
    String id;
    String socketSessionId;
    String userId;
    Instant createdAt;

}
