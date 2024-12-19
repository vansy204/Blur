package org.identityservice.configuration;

import org.identityservice.entity.User;
import org.identityservice.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AppConfiguration {
    private final PasswordEncoder passwordEncoder;

    @Bean
    ApplicationRunner runner(UserRepository userRepository) {
        return args -> {
            if (userRepository.findByUsername("admin").isEmpty()) {

                User user = User.builder()
                        .username("admin")
                        .password(passwordEncoder.encode("admin"))
                        //                        .roles(new HashSet<>(row))
                        .build();
                userRepository.save(user);
                log.info("admin user created with default password admin");
            }
        };
    }
}
