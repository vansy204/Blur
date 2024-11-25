package org.blurbackend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.Objects;

@ControllerAdvice
public class GlobalExceptions  {
    @ExceptionHandler(UserException.class)
    public ResponseEntity<ErrorDetails> UserExceptionHandler(UserException me, WebRequest req){

        ErrorDetails err = new ErrorDetails(me.getMessage(),"Validation Error", LocalDateTime.now());

        return new ResponseEntity<ErrorDetails>(err, HttpStatus.BAD_REQUEST);
    }


    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetails> MethodArgumentNotValidExceptionHandler(MethodArgumentNotValidException me, WebRequest req){

        ErrorDetails err = new ErrorDetails(Objects.requireNonNull(me.getBindingResult().getFieldError()).getDefaultMessage(),"Validation Error", LocalDateTime.now());

        return new ResponseEntity<ErrorDetails>(err, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> otherExceptionHandler(Exception e, WebRequest req){

        ErrorDetails err = new ErrorDetails(e.getMessage(),req.getDescription(false), LocalDateTime.now());

        return new ResponseEntity<ErrorDetails>(err, HttpStatus.BAD_REQUEST);
    }
}
