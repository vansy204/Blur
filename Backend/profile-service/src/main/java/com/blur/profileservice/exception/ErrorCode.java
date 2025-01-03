package com.blur.profileservice.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
@Getter
@AllArgsConstructor
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_PROFILE_NOT_FOUND(1010,"User profile not found",HttpStatus.NOT_FOUND),
    ;


    private int code;
    private String message;
    private HttpStatusCode httpStatusCode;
}
