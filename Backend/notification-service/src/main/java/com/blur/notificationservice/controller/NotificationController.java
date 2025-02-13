package com.blur.notificationservice.controller;

import com.blur.notificationservice.dto.even.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationController {
    //config kafka
    @KafkaListener(topics = "notification-delivery",groupId = "${spring.kafka.consumer.group-id}")
    public void listenNotificationDelivery(NotificationEvent message){
        try{
            log.info("Message receiver: {}",message);
        }catch (RuntimeException e){
            throw new RuntimeException("Lỗi xử lý: ", e);

        }
    }

}
