package org.blurbackend.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;
import org.blurbackend.enums.NotificationAction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    @ManyToOne
            @JoinColumn(name = "receiver_id", nullable = false)
    User receiver;
    String content;
    @Enumerated(EnumType.STRING)
    NotificationAction action;
    Boolean isSent;
    Boolean isRead;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @ManyToMany(cascade = {
            CascadeType.DETACH,
            CascadeType.MERGE,
            CascadeType.PERSIST,
            CascadeType.REFRESH
    }, fetch = FetchType.LAZY)
    List<User> sendBy = new ArrayList<>();

}
