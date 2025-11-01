package com.blur.apigateway.repository;


import com.blur.apigateway.dto.request.IntrospectRequest;
import com.blur.apigateway.dto.response.IntrospectResponse;
import com.blur.commonlibrary.dto.ApiResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.service.annotation.PostExchange;
import reactor.core.publisher.Mono;

public interface IdentityClient {
    @PostExchange(url = "/auth/introspect", contentType = MediaType.APPLICATION_JSON_VALUE)
    Mono<ApiResponse<IntrospectResponse>> introspect(@RequestBody IntrospectRequest request);
}
