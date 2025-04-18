package com.blur.notificationservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    CANNOT_SEND_EMAIL(1009, "Cannot send email", HttpStatus.INTERNAL_SERVER_ERROR),
    UNAUTHENTICATED(1011,"Unauthenticated",HttpStatus.UNAUTHORIZED),

            ;


    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;
}
