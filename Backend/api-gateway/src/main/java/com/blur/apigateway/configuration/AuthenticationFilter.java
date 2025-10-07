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
            "/notification/email/send",
            "/chat/messages.*",              // Match: /chat/messages, /chat/messages/create
            "/chat/conversations.*"           // Match: /chat/conversations/my-conversations
    };

    @Value("${app.api-prefix}")
    @NonFinal
    private String apiPrefix;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        log.info("=== Incoming Request ===");
        log.info("Path: {}", path);
        log.info("Method: {}", exchange.getRequest().getMethod());

        if (isPublicEndpoint(exchange.getRequest())) {
            log.info("✅ Public endpoint - Allowing request");
            return chain.filter(exchange);
        }

        // Get token from authorization header
        List<String> authHeader = exchange.getRequest().getHeaders().get(HttpHeaders.AUTHORIZATION);

        if (CollectionUtils.isEmpty(authHeader)) {
            log.warn("❌ No Authorization header found");
            return unauthenticated(exchange.getResponse());
        }

        String token = authHeader.get(0).replace("Bearer ", "");
        log.info("🔑 Token found, verifying...");

        // Verify token
        return identityService.introspect(token).flatMap(introspectResponse -> {
            if (introspectResponse.getResult().isValid()) {
                log.info("✅ Token valid - Allowing request");
                return chain.filter(exchange);
            } else {
                log.warn("❌ Token invalid");
                return unauthenticated(exchange.getResponse());
            }
        }).onErrorResume(throwable -> {
            log.error("❌ Token verification error: {}", throwable.getMessage());
            return unauthenticated(exchange.getResponse());
        });
    }

    @Override
    public int getOrder() {
        return -1; // Ensure filter runs first
    }

    private boolean isPublicEndpoint(ServerHttpRequest request) {
        String path = request.getURI().getPath();

        boolean isPublic = Arrays.stream(publicEnpoints).anyMatch(pattern -> {
            String fullPattern = apiPrefix + pattern;
            boolean matches = path.matches(fullPattern);

            log.debug("Checking: '{}' against pattern: '{}' → {}",
                    path, fullPattern, matches);

            return matches;
        });

        log.info("Is public endpoint: {}", isPublic);
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