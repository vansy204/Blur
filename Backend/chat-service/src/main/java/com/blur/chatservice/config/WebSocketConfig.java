package com.blur.chatservice.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt SimpleBroker cho các đích "/topic" (chat nhóm) và "/queue" (chat riêng)
        config.enableSimpleBroker("/topic", "/queue");
        // Tiền tố cho các tin nhắn gửi từ client tới server
        config.setApplicationDestinationPrefixes("/app");
        // (Tùy chọn) Đặt tiền tố cho đích người dùng (dùng để gửi tin nhắn riêng)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws") // Điểm kết nối WebSocket
                .setAllowedOrigins("http://localhost:3000") // Cho phép ReactJS
                .withSockJS(); // Hỗ trợ SockJS
    }
}