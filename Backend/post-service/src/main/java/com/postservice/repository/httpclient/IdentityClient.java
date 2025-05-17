package com.postservice.repository.httpclient;

import com.postservice.configuration.AuthenticationRequestInterceptor;
import com.postservice.dto.response.ApiResponse;
import com.postservice.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.service.identity.url}",configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityClient {
    @GetMapping("/users/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable String userId);
}
