package org.identityservice.controller;

import static org.mockito.ArgumentMatchers.any;

import java.time.LocalDate;

import org.identityservice.dto.request.UserCreationRequest;
import org.identityservice.dto.response.UserResponse;
import org.identityservice.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import lombok.extern.slf4j.Slf4j;

@SpringBootTest
@Slf4j
@AutoConfigureMockMvc
public class UserControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    private UserCreationRequest userCreationRequest;
    private UserResponse userResponse;
    private LocalDate dob;

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
    }

    @Test
    // happy test
    void createUser_validRequest_success() throws Exception {
        // given du lieu da cho
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(userCreationRequest);
        // vi writeValueAsString khong ho tro localDate nen phai them dependency
        // "com.fasterxml.jackson.datatype:jackson-datatype-jsr310"
        // mock creauser cua user service
        Mockito.when(userService.createUser(any())).thenReturn(userResponse);
        // when khi request den api nao then khi when thanh cong thi expect j
        mockMvc.perform(MockMvcRequestBuilders.post("/users")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content))
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("1000"))
                .andExpect(MockMvcResultMatchers.jsonPath("result.id").value("f96ebe1c"));
    }

    @Test
    // unhappy test
    void createUser_usernameInvalid_fail() throws Exception {
        // given du lieu da cho
        userCreationRequest.setUsername("joh");
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        String content = objectMapper.writeValueAsString(userCreationRequest);
        // vi writeValueAsString khong ho tro localDate nen phai them dependency
        // "com.fasterxml.jackson.datatype:jackson-datatype-jsr310"

        // when khi request den api nao then khi when thanh cong thi expect j
        mockMvc.perform(MockMvcRequestBuilders.post("/users")
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content(content))
                .andExpect(MockMvcResultMatchers.status().isBadRequest())
                .andExpect(MockMvcResultMatchers.jsonPath("code").value("1003"))
                .andExpect(MockMvcResultMatchers.jsonPath("message").value("User name must be at least 4 characters"));
    }
}
