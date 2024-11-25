package org.blurbackend.exception;

import java.time.LocalDateTime;

public class ErrorDetails {
     String message;
     String details;
     LocalDateTime timestamp;
    public ErrorDetails(String message, String details, LocalDateTime timestamp) {
        this.message = message;
        this.details = details;
        this.timestamp = timestamp;
    }
    public ErrorDetails() {}
}
