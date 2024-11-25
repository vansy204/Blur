package org.blurbackend.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NonNull;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;
import org.blurbackend.enums.ChatRoomStatus;
import org.blurbackend.enums.ChatRoomType;

import java.time.LocalDateTime;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "chat_rooms")
public class ChatRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    @ManyToOne
    @JoinColumn(name = "creator_id",nullable = false)
    User creator;
    @ManyToOne
    @JoinColumn(name = "receiver_id",nullable = false)
    User receiver;
    @Enumerated(EnumType.STRING)
    ChatRoomType type;
    @Enumerated(EnumType.STRING)
    ChatRoomStatus status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    LocalDateTime deletedAt;


}
