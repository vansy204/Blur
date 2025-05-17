package com.blur.notificationservice.controller;

import com.blur.notificationservice.dto.event.Event;
import com.blur.notificationservice.dto.response.ApiResponse;


import com.google.gson.Gson;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
@Slf4j
public class NotificationController {
    KafkaTemplate<String, String> kafkaTemplate;
    Gson gson;


    @PostMapping("/follow")
    public ApiResponse<?> sendFollowNotification(@RequestBody Event event) {
        String message = gson.toJson(event);
        log.info("Sending follow event to kafka: {}", message);
        kafkaTemplate.send("user-follow-events", message); // gui vao topic kafka

        return ApiResponse.builder().build();
    }
    @PutMapping("/like-post")
    public ApiResponse<?> sendLikePostNotification(@RequestBody Event event){
        String message = gson.toJson(event);
        log.info("Sending like post event to kafka: {}", message);
        kafkaTemplate.send("user-like-events", message);
        return ApiResponse.builder().build();
    }
    @PostMapping("/comment")
    public ApiResponse<?> sendCommentNotification(@RequestBody Event event){
        String message = gson.toJson(event);
        log.info("Sending comment event to kafka: {}", message);
        kafkaTemplate.send("user-comment-events", message);
        return ApiResponse.builder().build();
    }
    @PostMapping("/reply-comment")
    public ApiResponse<?> sendReplyCommentNotification(@RequestBody Event event){
        String message = gson.toJson(event);
        log.info("Sending reply comment event to kafka: {}", message);
        kafkaTemplate.send("user-reply-comment-events", message);
        return ApiResponse.builder().build();
    }
}
