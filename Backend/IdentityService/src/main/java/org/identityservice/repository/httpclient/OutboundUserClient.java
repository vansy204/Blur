package org.identityservice.repository.httpclient;

import feign.QueryMap;
import org.identityservice.dto.request.ExchangeTokenRequest;
import org.identityservice.dto.response.ExchangeTokenResponse;
import org.identityservice.dto.response.OutBoundUserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "outbound-user-client", url = "https://www.googleapis.com")
public interface OutboundUserClient {
    @GetMapping(value = "/oauth2/v1/userinfo")
    OutBoundUserResponse exchangeToken(@RequestParam("alt")String alt, @RequestParam("access_token") String accessToken);
}
