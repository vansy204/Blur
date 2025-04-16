package com.example.storyservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
@Getter
@AllArgsConstructor
public enum ErrorCode {
    USER_EXISTED(1019, "User already exists", HttpStatus.BAD_REQUEST),
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    COMMENT_NOT_FOUND(1021, "Comment not found", HttpStatus.NOT_FOUND),
    UNAUTHORIZED(1007, "you do not have permission", HttpStatus.FORBIDDEN),
    INVALID_KEY(1001, "Invalid message key", HttpStatus.BAD_REQUEST),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    POST_NOT_FOUND(1020, "Post not found", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND(1021, "User not found", HttpStatus.NOT_FOUND),
    STORY_NOT_FOUND(1022, "Story not found", HttpStatus.NOT_FOUND),
    STORY_LIKE_NOT_FOUND(1023, "Story like not found", HttpStatus.NOT_FOUND),
    ;
    private final int code;
    private final String message;
    final HttpStatus httpStatusCode;


}
