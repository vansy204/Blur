package com.example.storyservice.repository.httpclient;

import com.example.storyservice.configuration.AuthenticationRequestInterceptor;
import com.example.storyservice.dto.response.ApiResponse;
import com.example.storyservice.dto.response.UserResponse;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.service.identity.url}",configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityClient {
    @GetMapping("/users/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable String userId);
}
