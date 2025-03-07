package com.blur.profileservice.repository.httpclient;

import com.blur.profileservice.configuration.AuthenticationRequestInterceptor;
import com.blur.profileservice.dto.request.IntrospectRequest;
import com.blur.profileservice.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = {AuthenticationRequestInterceptor.class})
public interface IdentityClient {
    @PostMapping(value = "/auth/introspect", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<String> introspect(@RequestBody IntrospectRequest request);
}
