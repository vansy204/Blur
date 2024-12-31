package com.blur.apigateway.service;

import com.blur.apigateway.dto.request.IntrospecRequest;
import com.blur.apigateway.dto.response.ApiResponse;
import com.blur.apigateway.dto.response.IntrospecResponse;
import com.blur.apigateway.repository.IdentityClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class IdentityService {
    IdentityClient identityClient;
    public Mono<ApiResponse<IntrospecResponse>> introspect(String token) {
        return identityClient.introspect(IntrospecRequest.builder().token(token).build());
    }
}
