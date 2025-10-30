package com.blur.chatservice.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.corundumstudio.socketio.SocketIOServer;

@Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();

        config.setHostname("0.0.0.0");
        config.setPort(8099);

        // Cho phép kết nối từ React app
        config.setOrigin("http://www.blur.io.vn");

        // Tăng timeout để tránh disconnect nhanh
        config.setPingTimeout(60000);
        config.setPingInterval(25000);

        // Allow upgrade protocol
        config.setUpgradeTimeout(10000);

        return new SocketIOServer(config);
    }
}
