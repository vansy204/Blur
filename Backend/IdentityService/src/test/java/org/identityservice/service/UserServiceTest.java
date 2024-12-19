package org.identityservice.service;

import java.time.LocalDate;

import org.identityservice.dto.request.UserCreationRequest;
import org.identityservice.dto.response.UserResponse;
import org.identityservice.entity.User;
import org.identityservice.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import lombok.extern.slf4j.Slf4j;

@SpringBootTest
@Slf4j
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @MockitoBean
    private UserRepository userRepository;

    private UserCreationRequest userCreationRequest;
    private UserResponse userResponse;
    private LocalDate dob;
    private User user;

    @BeforeEach
    void initData() {
        dob = LocalDate.of(1990, 1, 1);
        userCreationRequest = UserCreationRequest.builder()
                .username("John")
                .firstName("John")
                .lastName("Doe")
                .dob(dob)
                .password("12345678")
                .build();
        userResponse = UserResponse.builder()
                .id("f96ebe1c")
                .username("John")
                .firstName("John")
                .lastName("Doe")
                .dob(dob)
                .build();
        user = User.builder()
                .id("f96ebe1c")
                .username("John")
                .firstName("John")
                .lastName("Doe")
                .dob(dob)
                .build();
    }

    //    @Test
    //    void createUser_validRequest_success() {
    //        //given
    //        when(userRepository.existsByUsername(anyString())).thenReturn(false);
    //        when(userRepository.save(any())).thenReturn(user);
    //
    //        //when
    //       var res = userService.createUser(userCreationRequest);
    //
    //        // then
    //
    //        Assertions.assertThat(res.getId()).isEqualTo("f96ebe1c");
    //        Assertions.assertThat(res.getUsername()).isEqualTo("John");
    //        Assertions.assertThat(res.getFirstName()).isEqualTo("John");
    //        Assertions.assertThat(res.getLastName()).isEqualTo("Doe");
    //        Assertions.assertThat(res.getDob()).isEqualTo(dob);
    //
    //    }

}
