package org.blurbackend.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "chat_messages")
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    @ManyToOne
    @JoinColumn(name = "room_id",nullable = false)
    ChatRoom room;
    @ManyToOne
    @JoinColumn(name = "sender_id",nullable = false)
    User sender;
    String message;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
