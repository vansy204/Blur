package com.blur.apigateway.repository;


import com.blur.apigateway.dto.request.IntrospecRequest;
import com.blur.apigateway.dto.response.ApiResponse;
import com.blur.apigateway.dto.response.IntrospecResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

public interface IdentityClient {
    @PostExchange(url = "/auth/introspect",contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<IntrospecResponse>> introspect(@RequestBody IntrospecRequest request);
}
