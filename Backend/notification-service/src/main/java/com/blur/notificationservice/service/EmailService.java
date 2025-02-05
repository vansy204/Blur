package com.blur.notificationservice.service;

import com.blur.notificationservice.dto.request.EmailRequest;
import com.blur.notificationservice.dto.request.SendEmailRequest;
import com.blur.notificationservice.dto.request.Sender;
import com.blur.notificationservice.dto.response.EmailResponse;
import com.blur.notificationservice.exception.AppException;
import com.blur.notificationservice.exception.ErrorCode;
import com.blur.notificationservice.repository.httpclient.EmailClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EmailService {
    EmailClient emailClient;
    @Value("${notification.email.brevo-apikey}")
    @NonFinal
    String apiKey;

    public EmailResponse sendEmail(SendEmailRequest request) {
        EmailRequest emailRequest = EmailRequest.builder()
                .sender(Sender.builder()
                        .name("blur.com")
                        .email("phamvansy204@gmail.com")
                        .build())
                .to(List.of(request.getTo()))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();
        try{
            return emailClient.sendEmail(apiKey ,emailRequest);
        }catch (FeignException ex){
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }
}
