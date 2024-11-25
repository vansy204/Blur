package org.blurbackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;
import org.blurbackend.dto.UserDto;
import org.blurbackend.enums.Role;
import org.blurbackend.enums.UserStatus;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;


@Entity
@Data
@FieldDefaults(level = AccessLevel.PACKAGE)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    Integer id;
    String userName;
    String firstName;
    String lastName;
    String email;
    @Enumerated(EnumType.STRING)
    Role role;
    @Enumerated(EnumType.STRING)
    UserStatus status;
    String mobile;
    String website;
    String bio;
    String gender;
    String image;
    String password;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime updatedAt;
    @Embedded
    @ElementCollection
    Set<UserDto> follower = new HashSet<>();
    @Embedded
    @ElementCollection
    Set<UserDto> following = new HashSet<>();


    @OneToMany(cascade = CascadeType.ALL,fetch = FetchType.LAZY)
    private List<Story> stories = new ArrayList<>();
    @ManyToMany(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    List<Post> savedPost;

    @ManyToMany(cascade = {
            CascadeType.DETACH,
            CascadeType.MERGE,
            CascadeType.PERSIST,
            CascadeType.REFRESH
    }, fetch = FetchType.LAZY)

    List<Story> viewedStories;

}
