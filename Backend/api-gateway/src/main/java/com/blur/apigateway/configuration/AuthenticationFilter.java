package com.blur.apigateway.configuration;

import com.blur.apigateway.dto.response.ApiResponse;
import com.blur.apigateway.service.IdentityService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonParseException;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationFilter implements GlobalFilter, Ordered {
    IdentityService identityService;
    ObjectMapper objectMapper;

    @NonFinal
    String[] publicEnpoints = {
            "/identity/auth/.*",
            "/identity/users/registration",
            "/identity/users/registrations",
            "/notification/email/send",
            "/chat",           // ✅ Match exact: /api/chat
            "/chat/.*"         // ✅ Match: /api/chat/health, /api/chat/messages, etc.
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("==========================================");
        log.info("🔍 Incoming request to: {}", exchange.getRequest().getURI().getPath());

        if (isPublicEndpoint(exchange.getRequest())) {
            log.info("✅ PUBLIC endpoint - Allowing without authentication");
            log.info("==========================================");
            return chain.filter(exchange);
        }


        log.info("🔒 PROTECTED endpoint - Checking authentication");

        // Get token from authorization header
        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);

        if (CollectionUtils.isEmpty(authHeader)) {
            log.warn("❌ No Authorization header found");
            log.info("==========================================");
            return unauthenticated(exchange.getResponse());
        }

        String token = authHeader.get(0).replace("Bearer ", "");
        log.info("🎫 Token found, validating...");

        // Verify token
        return identityService.introspect(token).flatMap(introspectResponse -> {
            if (introspectResponse.getResult().isValid()) {
                log.info("✅ Token is VALID");
                log.info("==========================================");
                return chain.filter(exchange);
            } else {
                log.warn("❌ Token is INVALID");
                log.info("==========================================");
                return unauthenticated(exchange.getResponse());
            }
        }).onErrorResume(throwable -> {
            log.error("❌ Error validating token: {}", throwable.getMessage());
            log.info("==========================================");
            return unauthenticated(exchange.getResponse());
        });
    }

    @Override
    public int getOrder() {
        return -1;
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();

        log.info("📍 Request path: {}", path);
        log.info("🔧 API prefix: {}", apiPrefix);

        boolean isPublic = Arrays.stream(publicEnpoints).anyMatch(pattern -> {
            String fullPattern = apiPrefix + pattern;
            boolean matches = path.matches(fullPattern);

            log.info("   Testing pattern: {} → {}", fullPattern, matches ? "✅ MATCH" : "❌ NO MATCH");

            return matches;
        });

        log.info("🎯 Final result: {} is {}", path, isPublic ? "PUBLIC ✅" : "PROTECTED 🔒");
        return isPublic;
    }

    Mono<Void> unauthenticated(ServerHttpResponse response) {
        ApiResponse<?> apiResponse = ApiResponse.builder()
                .code(1401)
                .message("Unauthenticated")
                .build();

        String body;
        try {
            body = objectMapper.writeValueAsString(apiResponse);
        } catch (JsonProcessingException e) {
            throw new JsonParseException(e);
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);

        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes())));
    }
}