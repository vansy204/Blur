package com.blur.chatservice.entity;

import com.blur.chatservice.enums.MessageType;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
@RequiredArgsConstructor
@Data
@AllArgsConstructor
@NoArgsConstructor
@Slf4j
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    String content;
    String sender;
    MessageType type;

}
