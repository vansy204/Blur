package com.blur.profileservice.repository.httpclient;

import com.blur.profileservice.configuration.AuthenticationRequestInterceptor;
import com.blur.profileservice.dto.event.Event;
import com.blur.profileservice.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${app.services.notification}",configuration = {AuthenticationRequestInterceptor.class})
public interface NotificationClient {
    @PostMapping(value = "/follow",  produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<?> sendFollowNotification(@RequestBody Event event);
    @PutMapping(value = "/like-post", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<?> sendLikePostNotification(@RequestBody Event event);
}
