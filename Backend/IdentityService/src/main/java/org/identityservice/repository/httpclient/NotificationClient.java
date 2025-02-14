package org.identityservice.repository.httpclient;

import org.identityservice.dto.request.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "notification-service",
        url = "${app.services.notification}")
public interface NotificationClient {
    @PostMapping(value = "/email/send",produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse sendEmail(@RequestBody Email email);
}
