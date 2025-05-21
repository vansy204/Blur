package com.blur.chatservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
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
    ;
    private final int code;
    private final String message;
    final HttpStatus httpStatus;


}
