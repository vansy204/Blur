package org.blurbackend.model;


import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;
import org.yaml.snakeyaml.comments.CommentType;

import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    String content;
    @ManyToOne
            @JoinColumn(name = "user_id", nullable = false)
            User user;
    @ManyToOne
            @JoinColumn(name = "post_id",nullable = false)
            Post post;
    String parentId;
    Integer likedCount = 0;
    Integer dislikedCount = 0;
    Integer replyCount = 0;
    @Enumerated(EnumType.STRING)
    CommentType type;

    @Embedded
    @ElementCollection
    Set<UserDto> likedByUser = new HashSet<>();
}
