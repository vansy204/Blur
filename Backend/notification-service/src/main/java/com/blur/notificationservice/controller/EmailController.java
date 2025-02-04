package com.blur.notificationservice.controller;

import com.blur.notificationservice.dto.request.EmailRequest;
import com.blur.notificationservice.dto.request.SendEmailRequest;
import com.blur.notificationservice.dto.response.ApiResponse;
import com.blur.notificationservice.dto.response.EmailResponse;
import com.blur.notificationservice.service.EmailService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailController {
    EmailService emailService;
    @PostMapping("/email/send")
    public ApiResponse<EmailResponse> sendEmail(@RequestBody SendEmailRequest sendEmailRequest) {
        return  ApiResponse.<EmailResponse>builder()
                .result(emailService.sendEmail(sendEmailRequest))
                .build();
    }

}
