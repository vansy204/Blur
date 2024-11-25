package org.blurbackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    String content;
    String image;
    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    User author;

    @Embedded
    @ElementCollection
    @JoinTable(name = "likedByUsers", joinColumns = @JoinColumn(name = "user_id"))
    Set<UserDto> likedByUsers = new HashSet<>();
    Integer commentsCount = 0;
    Integer likesCount = 0;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime updatedAt;


    @OneToMany
    List<Comment> comments = new ArrayList<>();


}
