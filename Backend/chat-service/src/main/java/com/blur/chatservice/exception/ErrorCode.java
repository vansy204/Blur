package com.blur.chatservice.exception;

import org.springframework.http.HttpStatus;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHORIZED(1007, "you do not have permission", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    MESSAGE_NOT_FOUND(1029, "Message not found", HttpStatus.NOT_FOUND),
    FILE_NOT_FOUND(1030, "File not found", HttpStatus.NOT_FOUND),
    USER_NOT_AUTHENTICATED(1031, "User not authenticated", HttpStatus.NOT_FOUND),
    USER_PROFILE_NOT_FOUND(1032, "User profile not found", HttpStatus.NOT_FOUND),
    CONVERSATION_NOT_FOUND(1033, "Conversation not found", HttpStatus.NOT_FOUND),
    INVALID_FILE(400, "Invalid file", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(400, "File size exceeds limit", HttpStatus.BAD_REQUEST),
    INVALID_FILE_TYPE(400, "File type not allowed", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(500, "File upload failed", HttpStatus.INTERNAL_SERVER_ERROR);
    private final int code;
    private final String message;
    final HttpStatus httpStatus;
}
