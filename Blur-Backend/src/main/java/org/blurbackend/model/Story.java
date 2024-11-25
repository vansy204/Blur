package org.blurbackend.model;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;
import org.blurbackend.enums.StoryStatus;

import java.sql.Timestamp;
import java.time.LocalDateTime;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "stories")
public class Story {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    @ManyToOne
            @JoinColumn(name = "user_id")
            User user;
    String content;
    Integer likesCount = 0;
    Integer commentsCount = 0;
    String media;
    Timestamp expiresAt;
    @Enumerated(EnumType.STRING)
    StoryStatus storyStatus;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
