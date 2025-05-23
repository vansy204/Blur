package com.example.storyservice.repository.httpclient;

import com.example.storyservice.dto.event.Event;
import com.example.storyservice.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${app.service.notification.url}")
public interface NotificationClient {
    @PostMapping("/like-story")
    public ApiResponse<?> sendLikeStoryNotification(@RequestBody Event event);
}
