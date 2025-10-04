package com.blur.chatservice.configuration;

import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;

@Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config =
                new com.corundumstudio.socketio.Configuration();

        config.setHostname("0.0.0.0");
        config.setPort(8099);

        // Cho phép kết nối từ React app
        config.setOrigin("http://localhost:3000");

        // Tăng timeout để tránh disconnect nhanh
        config.setPingTimeout(60000);
        config.setPingInterval(25000);

        // Allow upgrade protocol
        config.setUpgradeTimeout(10000);

        return new SocketIOServer(config);
    }


}